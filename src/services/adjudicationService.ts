import { AdjudicationResult, PolicyData, MedicineMatch, LabTestMatch, OthersMatch } from '../types';
import { getPolicyData } from '../data/policies';
import { matchingService } from './matchingService';

export class AdjudicationService {
  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      return new Date(dateStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if policy is active based on dates
   */
  private isPolicyActive(policy: PolicyData, invoiceDate?: string): boolean {
    const now = new Date();
    const policyStart = this.parseDate(policy.policy_basic_info.policy_start_date);
    const policyEnd = this.parseDate(policy.policy_basic_info.policy_end_date);

    if (policyStart && now < policyStart) {
      return false; // Policy hasn't started yet
    }

    if (policyEnd && now > policyEnd) {
      return false; // Policy has expired
    }

    // Check invoice date if provided
    if (invoiceDate) {
      const invDate = this.parseDate(invoiceDate);
      if (invDate && policyStart && invDate < policyStart) {
        return false; // Invoice before policy start
      }
      if (invDate && policyEnd && invDate > policyEnd) {
        return false; // Invoice after policy end
      }
    }

    return true;
  }

  /**
   * Check if benefit is covered in policy
   */
  private isBenefitCovered(policy: PolicyData, reimbursementType: string): boolean {
    const coveredBenefits = policy.policy_coverage.covered_benefits || [];
    
    // Map reimbursement types to policy benefits (simplified for hackathon)
    const benefitMapping: { [key: string]: string[] } = {
      'Prescribed Medicines': ['Prescribed pharmacy (Allopathic only)', 'Prescribed Pharmacy'],
      'Prescribed Diagnostics': ['Prescribed diagnostics (Pathology & Radiology)', 'Prescribed Diagnostics'],
      'Consultation': ['Doctor consultations (General Physician, Specialist, Super Specialist - Allopathic)', 'GP/Specialist Consultation'],
      'Dental': ['Dental - except Cosmetic', 'Dental Procedure'],
      'Vision': ['Vision including Prescription lens and Frames cover', 'Vision Procedure'],
    };

    const possibleBenefits = benefitMapping[reimbursementType] || [];
    return possibleBenefits.some(benefit => 
      coveredBenefits.some(covered => covered.includes(benefit) || benefit.includes(covered))
    );
  }

  /**
   * Get specific reason why item is not covered
   */
  private getItemNotCoveredReason(policy: PolicyData, itemName: string, category: 'medicine' | 'lab' | 'other'): string {
    const itemLower = itemName.toLowerCase();
    
    // Check exclusions first
    const exclusions = policy.policy_exclusions.excluded_conditions || [];
    for (const exclusion of exclusions) {
      const exclusionLower = exclusion.toLowerCase();
      if (itemLower.includes(exclusionLower) || exclusionLower.includes(itemLower)) {
        return `Item "${itemName}" is excluded under policy: "${exclusion}"`;
      }
    }

    // Check category-specific coverage
    const coveredBenefits = policy.policy_coverage.covered_benefits || [];
    
    if (category === 'medicine') {
      const hasPharmacyCoverage = coveredBenefits.some(b => 
        b.toLowerCase().includes('pharmacy') || b.toLowerCase().includes('medicine')
      );
      if (!hasPharmacyCoverage) {
        return `Medicines are not covered under this policy. Covered benefits: ${coveredBenefits.join(', ')}`;
      }
      // Check if it's OTC (over-the-counter)
      const otcKeywords = ['supplement', 'vitamin', 'protein', 'glucose', 'horlicks', 'whey'];
      if (otcKeywords.some(keyword => itemLower.includes(keyword))) {
        return `Item "${itemName}" appears to be an OTC (over-the-counter) product which is not covered under policy exclusions`;
      }
    }
    
    if (category === 'lab') {
      const hasDiagnosticsCoverage = coveredBenefits.some(b => 
        b.toLowerCase().includes('diagnostic') || b.toLowerCase().includes('pathology') || b.toLowerCase().includes('radiology')
      );
      if (!hasDiagnosticsCoverage) {
        return `Diagnostics/Lab tests are not covered under this policy. Covered benefits: ${coveredBenefits.join(', ')}`;
      }
    }
    
    if (category === 'other') {
      // Check if it's a procedure fee (usually excluded)
      if (itemLower.includes('procedure') || itemLower.includes('fee')) {
        return `Procedure fees are excluded under policy exclusions`;
      }
    }

    return `Item "${itemName}" does not fall under any covered benefits in the policy`;
  }

  /**
   * Check policy limits for a category
   */
  private checkPolicyLimit(
    policy: PolicyData,
    category: 'medicine' | 'lab' | 'other',
    itemAmount: number,
    categoryTotalUsed: number = 0
  ): { withinLimit: boolean; limitAmount?: number; remaining?: number; reason?: string } {
    const coverageLimits = policy.policy_coverage.coverage_limits || [];
    
    let limitConfig: any = null;
    if (category === 'medicine') {
      limitConfig = coverageLimits.find(l => 
        l.benefit_name.toLowerCase().includes('pharmacy') || 
        l.benefit_name.toLowerCase().includes('medicine')
      );
    } else if (category === 'lab') {
      limitConfig = coverageLimits.find(l => 
        l.benefit_name.toLowerCase().includes('diagnostic') || 
        l.benefit_name.toLowerCase().includes('pathology') || 
        l.benefit_name.toLowerCase().includes('radiology')
      );
    }
    
    if (!limitConfig || limitConfig.limit_amount === 0) {
      return { withinLimit: true }; // Unlimited or no limit
    }
    
    const limitAmount = limitConfig.limit_amount;
    const remaining = limitAmount - categoryTotalUsed;
    const withinLimit = (categoryTotalUsed + itemAmount) <= limitAmount;
    
    if (!withinLimit) {
      const reimbursableAmount = Math.max(0, remaining);
      return {
        withinLimit: false,
        limitAmount,
        remaining: reimbursableAmount,
        reason: `Policy limit exceeded: ${limitConfig.benefit_name} limit ₹${limitAmount.toLocaleString('en-IN')}/${limitConfig.limit_type}. Used: ₹${categoryTotalUsed.toLocaleString('en-IN')}. Remaining: ₹${reimbursableAmount.toLocaleString('en-IN')}. Item cost ₹${itemAmount.toLocaleString('en-IN')} exceeds remaining limit by ₹${(itemAmount - reimbursableAmount).toLocaleString('en-IN')}.`
      };
    }
    
    return { withinLimit: true, limitAmount, remaining };
  }

  /**
   * Check if item is covered by policy with detailed reason
   */
  private checkItemCoverage(
    policy: PolicyData,
    itemName: string,
    category: 'medicine' | 'lab' | 'other',
    isPrescriptionMatch: boolean,
    itemAmount?: number,
    categoryTotalUsed?: number
  ): { covered: boolean; reason?: string; reimbursableAmount?: number } {
    // If not in prescription, it's not covered (for medicines and labs)
    if ((category === 'medicine' || category === 'lab') && !isPrescriptionMatch) {
      return {
        covered: false,
        reimbursableAmount: 0,
        reason: category === 'medicine' 
          ? `Medicine "${itemName}" is not prescribed in the prescription`
          : `Lab test "${itemName}" is not prescribed in the prescription`
      };
    }

    // Check exclusions
    if (this.isExcluded(policy, itemName)) {
      return {
        covered: false,
        reimbursableAmount: 0,
        reason: this.getItemNotCoveredReason(policy, itemName, category)
      };
    }

    // Check category coverage
    const coveredBenefits = policy.policy_coverage.covered_benefits || [];
    
    if (category === 'medicine') {
      const hasPharmacyCoverage = coveredBenefits.some(b => 
        b.toLowerCase().includes('pharmacy') || b.toLowerCase().includes('medicine')
      );
      if (!hasPharmacyCoverage) {
        return {
          covered: false,
          reimbursableAmount: 0,
          reason: `Medicines are not covered under this policy. Available benefits: ${coveredBenefits.join(', ')}`
        };
      }
    }
    
    if (category === 'lab') {
      const hasDiagnosticsCoverage = coveredBenefits.some(b => 
        b.toLowerCase().includes('diagnostic') || b.toLowerCase().includes('pathology') || b.toLowerCase().includes('radiology')
      );
      if (!hasDiagnosticsCoverage) {
        return {
          covered: false,
          reimbursableAmount: 0,
          reason: `Lab tests/Diagnostics are not covered under this policy. Available benefits: ${coveredBenefits.join(', ')}`
        };
      }
    }

    // Check policy limits if amount provided
    if (itemAmount !== undefined && categoryTotalUsed !== undefined) {
      const limitCheck = this.checkPolicyLimit(policy, category, itemAmount, categoryTotalUsed);
      if (!limitCheck.withinLimit) {
        // Partial approval if there's remaining limit
        const partialAmount = limitCheck.remaining || 0;
        if (partialAmount > 0) {
          // Partially covered - can reimburse up to remaining limit
          return {
            covered: true, // Mark as covered for partial approval
            reimbursableAmount: partialAmount,
            reason: limitCheck.reason
          };
        } else {
          // Completely rejected - limit exhausted
          return {
            covered: false,
            reimbursableAmount: 0,
            reason: limitCheck.reason
          };
        }
      }
    }

    return { 
      covered: true, 
      reimbursableAmount: itemAmount !== undefined ? itemAmount : undefined 
    };
  }

  /**
   * Check if item is excluded
   */
  private isExcluded(policy: PolicyData, itemName: string): boolean {
    const exclusions = policy.policy_exclusions.excluded_conditions || [];
    const itemLower = itemName.toLowerCase();
    
    return exclusions.some(exclusion => {
      const exclusionLower = exclusion.toLowerCase();
      // Simple check - in production, use more sophisticated matching
      return itemLower.includes(exclusionLower) || exclusionLower.includes(itemLower);
    });
  }

  /**
   * Main adjudication method
   */
  async adjudicate(
    prescriptionData: any,
    invoiceData: any,
    labReportData: any,
    policyName: string,
    matchingResults: {
      medicines: MedicineMatch[];
      labTests: LabTestMatch[];
      others: OthersMatch[];
    }
  ): Promise<AdjudicationResult> {
    console.log(`[Adjudication] Starting adjudication for policy: ${policyName}`);
    console.log(`[Adjudication] Matching results - Medicines: ${matchingResults.medicines.length}, Lab Tests: ${matchingResults.labTests.length}, Others: ${matchingResults.others.length}`);
    
    const rejectionReasons: Array<{ value: string; title: string; reasoning: string }> = [];
    const policyValidation: any = {
      isActive: false,
      isDateValid: false,
      benefitCoverage: false,
      coverageLimits: false,
    };

    // Get policy data
    const policy = getPolicyData(policyName);
    if (!policy) {
      console.log(`[Adjudication] Policy not found: ${policyName}`);
      return {
        approved: false,
        rejectionReasons: [{
          value: 'policyNotFound',
          title: 'Policy not found',
          reasoning: `Policy "${policyName}" not found in system`,
        }],
        notes: 'Policy data not available',
        processedAt: new Date(),
        matchingResults,
        policyValidation,
      };
    }

    // Extract invoice date
    const invoiceDate = invoiceData?.invoice_metadata?.invoice_date || 
                       invoiceData?.data?.invoice_metadata?.invoice_date;

    // Check policy active status
    const isActive = this.isPolicyActive(policy, invoiceDate);
    policyValidation.isActive = isActive;
    policyValidation.isDateValid = isActive;

    if (!isActive) {
      if (invoiceDate) {
        const invDate = this.parseDate(invoiceDate);
        const policyStart = this.parseDate(policy.policy_basic_info.policy_start_date);
        if (invDate && policyStart && invDate < policyStart) {
          rejectionReasons.push({
            value: 'invoiceBeforePolicyDate',
            title: 'Invoice date is before policy start date',
            reasoning: `Invoice date (${invoiceDate}) is before policy start date (${policy.policy_basic_info.policy_start_date})`,
          });
        } else {
          rejectionReasons.push({
            value: 'policyNotActive',
            title: 'Policy is not active',
            reasoning: 'Policy is not active for the invoice date',
          });
        }
      } else {
        rejectionReasons.push({
          value: 'policyNotActive',
          title: 'Policy is not active',
          reasoning: 'Policy is not currently active',
        });
      }
    }

    // Get invoice line items first
    const invoiceMedicines = invoiceData?.billing_info?.line_items?.medicines || 
                             invoiceData?.data?.billing_info?.line_items?.medicines || [];
    const invoiceLabTests = invoiceData?.billing_info?.line_items?.lab_tests || 
                            invoiceData?.data?.billing_info?.line_items?.lab_tests || [];
    const invoiceOthers = invoiceData?.billing_info?.line_items?.others || 
                         invoiceData?.data?.billing_info?.line_items?.others || [];

    // Check reimbursement type and benefit coverage
    // Handle both string and object formats
    let reimbursementType: string | undefined;
    const rawReimbursementType = invoiceData?.reimbursement_type || 
                                 invoiceData?.data?.reimbursement_type;
    
    if (rawReimbursementType) {
      // Handle object format: { type: "..." }
      if (typeof rawReimbursementType === 'object' && rawReimbursementType.type) {
        reimbursementType = rawReimbursementType.type;
      } 
      // Handle string format
      else if (typeof rawReimbursementType === 'string') {
        reimbursementType = rawReimbursementType;
      }
    }
    
    if (reimbursementType && reimbursementType.trim() !== '') {
      const benefitCovered = this.isBenefitCovered(policy, reimbursementType);
      policyValidation.benefitCoverage = benefitCovered;
      
      if (!benefitCovered) {
        rejectionReasons.push({
          value: 'benefitNotCovered',
          title: 'Benefit is not covered in policy',
          reasoning: `Reimbursement type "${reimbursementType}" is not covered under the policy. Available benefits: ${policy.policy_coverage.covered_benefits.join(', ')}`,
        });
      }
    } else {
      // If reimbursement type is missing or empty, don't reject based on type alone
      // Individual item checks will handle coverage validation
      policyValidation.benefitCoverage = true; // Set to true to avoid false rejection
    }

    console.log(`[Adjudication] Invoice items - Medicines: ${invoiceMedicines.length}, Lab Tests: ${invoiceLabTests.length}, Others: ${invoiceOthers.length}`);
    console.log(`[Adjudication] Policy covered benefits:`, policy.policy_coverage.covered_benefits);
    console.log(`[Adjudication] Policy exclusions:`, policy.policy_exclusions.excluded_conditions);

    // Track amounts for partial claim support
    let totalClaimedAmount = 0;
    let totalReimbursableAmount = 0;
    let medicineTotalUsed = 0;
    let labTestTotalUsed = 0;
    const uncoveredItems: Array<{ category: string; name: string; reason: string; amount: number; reimbursableAmount: number }> = [];
    const policyLimitInsights: string[] = [];

    // Process medicines - item-level adjudication
    for (let i = 0; i < invoiceMedicines.length; i++) {
      const medicine = invoiceMedicines[i];
      const match = matchingResults.medicines[i] || { isPrescriptionMatch: false };
      const itemAmount = medicine.total_cost || medicine.total || 0;
      totalClaimedAmount += itemAmount;
      
      const coverage = this.checkItemCoverage(
        policy, 
        medicine.name, 
        'medicine', 
        match.isPrescriptionMatch,
        itemAmount,
        medicineTotalUsed
      );
      
      const reimbursable = coverage.reimbursableAmount !== undefined ? coverage.reimbursableAmount : (coverage.covered ? itemAmount : 0);
      
      if (coverage.covered || reimbursable > 0) {
        // Item is fully or partially covered
        totalReimbursableAmount += reimbursable;
        medicineTotalUsed += reimbursable;
        
        // Update match with adjudicated amount
        if (matchingResults.medicines[i]) {
          (matchingResults.medicines[i] as any).adjudicatedAmount = reimbursable;
        }
        
        // If partially covered (limit exceeded), add insight
        if (reimbursable > 0 && reimbursable < itemAmount) {
          policyLimitInsights.push(coverage.reason || `Partial approval: ₹${reimbursable.toLocaleString('en-IN')} of ₹${itemAmount.toLocaleString('en-IN')} for "${medicine.name}"`);
        }
      } else {
        // Item is completely rejected
        uncoveredItems.push({
          category: 'medicine',
          name: medicine.name,
          reason: coverage.reason || `Medicine "${medicine.name}" is not covered`,
          amount: itemAmount,
          reimbursableAmount: 0
        });
      }
    }

    // Process lab tests - item-level adjudication
    for (let i = 0; i < invoiceLabTests.length; i++) {
      const labTest = invoiceLabTests[i];
      const match = matchingResults.labTests[i] || { isPrescriptionMatch: false };
      const itemAmount = labTest.total_cost || labTest.total || 0;
      totalClaimedAmount += itemAmount;
      
      const coverage = this.checkItemCoverage(
        policy, 
        labTest.name, 
        'lab', 
        match.isPrescriptionMatch,
        itemAmount,
        labTestTotalUsed
      );
      
      const reimbursable = coverage.reimbursableAmount !== undefined ? coverage.reimbursableAmount : (coverage.covered ? itemAmount : 0);
      
      if (coverage.covered || reimbursable > 0) {
        // Item is fully or partially covered
        totalReimbursableAmount += reimbursable;
        labTestTotalUsed += reimbursable;
        
        // Update match with adjudicated amount
        if (matchingResults.labTests[i]) {
          (matchingResults.labTests[i] as any).adjudicatedAmount = reimbursable;
        }
        
        // If partially covered (limit exceeded), add insight
        if (reimbursable > 0 && reimbursable < itemAmount) {
          policyLimitInsights.push(coverage.reason || `Partial approval: ₹${reimbursable.toLocaleString('en-IN')} of ₹${itemAmount.toLocaleString('en-IN')} for "${labTest.name}"`);
        }
      } else {
        // Item is completely rejected
        uncoveredItems.push({
          category: 'lab',
          name: labTest.name,
          reason: coverage.reason || `Lab test "${labTest.name}" is not covered`,
          amount: itemAmount,
          reimbursableAmount: 0
        });
      }
    }

    // Process others - item-level adjudication
    for (let i = 0; i < invoiceOthers.length; i++) {
      const other = invoiceOthers[i];
      const match = matchingResults.others[i] || { isPrescriptionMatch: false };
      const itemAmount = other.total_cost || other.total || 0;
      
      // Financial items are auto-approved
      const nameLower = other.name.toLowerCase();
      const isFinancial = nameLower.includes('discount') || 
                         nameLower.includes('gst') || 
                         nameLower.includes('tax') ||
                         nameLower.includes('cgst') ||
                         nameLower.includes('sgst');
      
      if (isFinancial) {
        // Financial items are always approved
        totalClaimedAmount += itemAmount;
        totalReimbursableAmount += itemAmount;
      } else {
        totalClaimedAmount += itemAmount;
        const coverage = this.checkItemCoverage(policy, other.name, 'other', match.isPrescriptionMatch || false);
        
        if (coverage.covered) {
          totalReimbursableAmount += itemAmount;
        } else {
          uncoveredItems.push({
            category: 'other',
            name: other.name,
            reason: coverage.reason || `Service "${other.name}" is not covered`,
            amount: itemAmount,
            reimbursableAmount: 0
          });
        }
      }
    }

    // Group uncovered items by category for rejection reasons
    const uncoveredMedicines = uncoveredItems.filter(item => item.category === 'medicine' && item.reimbursableAmount === 0);
    const uncoveredLabTests = uncoveredItems.filter(item => item.category === 'lab' && item.reimbursableAmount === 0);
    const uncoveredOthers = uncoveredItems.filter(item => item.category === 'other');

    // Only add rejection reasons for items that are completely rejected (not partial)
    if (uncoveredMedicines.length > 0) {
      rejectionReasons.push({
        value: 'benefitNotCovered',
        title: 'Medicines not covered under policy',
        reasoning: uncoveredMedicines.map(item => item.reason).join('; ')
      });
    }

    if (uncoveredLabTests.length > 0) {
      rejectionReasons.push({
        value: 'benefitNotCovered',
        title: 'Lab tests not covered under policy',
        reasoning: uncoveredLabTests.map(item => item.reason).join('; ')
      });
    }

    if (uncoveredOthers.length > 0) {
      rejectionReasons.push({
        value: 'benefitNotCovered',
        title: 'Services not covered under policy',
        reasoning: uncoveredOthers.map(item => item.reason).join('; ')
      });
    }

    // Check coverage limits
    const sumInsured = policy.policy_basic_info.sum_insured || 0;
    const coverageLimitsValid = sumInsured === 0 || totalReimbursableAmount <= sumInsured;
    policyValidation.coverageLimits = coverageLimitsValid;

    if (!coverageLimitsValid) {
      const remaining = Math.max(0, sumInsured);
      policyLimitInsights.push(`Total sum insured limit ₹${sumInsured.toLocaleString('en-IN')} exceeded. Claimed: ₹${totalClaimedAmount.toLocaleString('en-IN')}, Reimbursable: ₹${totalReimbursableAmount.toLocaleString('en-IN')}, Remaining limit: ₹${remaining.toLocaleString('en-IN')}.`);
    }

    // Final decision - approve if there's any reimbursable amount (partial claim)
    // Only fully reject if there are critical issues (policy not active, etc.) AND no reimbursable amount
    const hasCriticalRejections = rejectionReasons.some(r => 
      r.value === 'policyNotFound' || 
      r.value === 'policyNotActive' || 
      r.value === 'invoiceBeforePolicyDate'
    );
    
    const approved = totalReimbursableAmount > 0 && !hasCriticalRejections;

    // Build AI explanation
    let aiExplanation = '';
    if (totalReimbursableAmount > 0 && totalReimbursableAmount < totalClaimedAmount) {
      aiExplanation = `Partial claim approved. Claimed: ₹${totalClaimedAmount.toLocaleString('en-IN')}, Reimbursable: ₹${totalReimbursableAmount.toLocaleString('en-IN')} (${((totalReimbursableAmount / totalClaimedAmount) * 100).toFixed(1)}%).`;
      if (policyLimitInsights.length > 0) {
        aiExplanation += ' ' + policyLimitInsights.join(' ');
      }
    } else if (totalReimbursableAmount === totalClaimedAmount && totalReimbursableAmount > 0) {
      aiExplanation = `Full claim approved. All items are covered under the policy.`;
    } else {
      aiExplanation = `Claim rejected. No items are eligible for reimbursement.`;
    }

    console.log(`[Adjudication] Final decision - Approved: ${approved}`);
    console.log(`[Adjudication] Total claimed: ₹${totalClaimedAmount}, Total reimbursable: ₹${totalReimbursableAmount}`);
    if (rejectionReasons.length > 0) {
      console.log(`[Adjudication] Rejection reasons:`, JSON.stringify(rejectionReasons, null, 2));
    }

    return {
      approved,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
      totalClaimedAmount,
      totalReimbursableAmount,
      aiExplanation,
      notes: approved 
        ? (totalReimbursableAmount === totalClaimedAmount 
          ? 'Adjudication completed successfully - all items approved' 
          : `Partial claim approved - ${totalReimbursableAmount.toLocaleString('en-IN')} of ${totalClaimedAmount.toLocaleString('en-IN')} reimbursable`)
        : `Adjudication failed with ${rejectionReasons.length} rejection reason(s)`,
      processedAt: new Date(),
      matchingResults,
      policyValidation,
    };
  }
}

export const adjudicationService = new AdjudicationService();
