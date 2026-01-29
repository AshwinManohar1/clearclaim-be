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
   * Check if item is covered by policy with detailed reason
   */
  private checkItemCoverage(
    policy: PolicyData,
    itemName: string,
    category: 'medicine' | 'lab' | 'other',
    isPrescriptionMatch: boolean
  ): { covered: boolean; reason?: string } {
    // If not in prescription, it's not covered (for medicines and labs)
    if ((category === 'medicine' || category === 'lab') && !isPrescriptionMatch) {
      return {
        covered: false,
        reason: category === 'medicine' 
          ? `Medicine "${itemName}" is not prescribed in the prescription`
          : `Lab test "${itemName}" is not prescribed in the prescription`
      };
    }

    // Check exclusions
    if (this.isExcluded(policy, itemName)) {
      return {
        covered: false,
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
          reason: `Lab tests/Diagnostics are not covered under this policy. Available benefits: ${coveredBenefits.join(', ')}`
        };
      }
    }

    return { covered: true };
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

    // Check reimbursement type and benefit coverage
    const reimbursementType = invoiceData?.reimbursement_type || 
                              invoiceData?.data?.reimbursement_type;
    
    if (reimbursementType) {
      const benefitCovered = this.isBenefitCovered(policy, reimbursementType);
      policyValidation.benefitCoverage = benefitCovered;
      
      if (!benefitCovered) {
        rejectionReasons.push({
          value: 'benefitNotCovered',
          title: 'Benefit is not covered in policy',
          reasoning: `Reimbursement type "${reimbursementType}" is not covered under the policy`,
        });
      }
    }

    // Get invoice line items
    const invoiceMedicines = invoiceData?.billing_info?.line_items?.medicines || 
                             invoiceData?.data?.billing_info?.line_items?.medicines || [];
    const invoiceLabTests = invoiceData?.billing_info?.line_items?.lab_tests || 
                            invoiceData?.data?.billing_info?.line_items?.lab_tests || [];
    const invoiceOthers = invoiceData?.billing_info?.line_items?.others || 
                         invoiceData?.data?.billing_info?.line_items?.others || [];

    console.log(`[Adjudication] Invoice items - Medicines: ${invoiceMedicines.length}, Lab Tests: ${invoiceLabTests.length}, Others: ${invoiceOthers.length}`);
    console.log(`[Adjudication] Policy covered benefits:`, policy.policy_coverage.covered_benefits);
    console.log(`[Adjudication] Policy exclusions:`, policy.policy_exclusions.excluded_conditions);

    // Check each medicine against policy
    const uncoveredMedicines: string[] = [];
    for (let i = 0; i < invoiceMedicines.length; i++) {
      const medicine = invoiceMedicines[i];
      const match = matchingResults.medicines[i] || { isPrescriptionMatch: false };
      const coverage = this.checkItemCoverage(policy, medicine.name, 'medicine', match.isPrescriptionMatch);
      
      if (!coverage.covered) {
        uncoveredMedicines.push(coverage.reason || `Medicine "${medicine.name}" is not covered`);
      }
    }

    if (uncoveredMedicines.length > 0) {
      rejectionReasons.push({
        value: 'benefitNotCovered',
        title: 'Medicines not covered under policy',
        reasoning: uncoveredMedicines.join('; ')
      });
    }

    // Check each lab test against policy
    const uncoveredLabTests: string[] = [];
    for (let i = 0; i < invoiceLabTests.length; i++) {
      const labTest = invoiceLabTests[i];
      const match = matchingResults.labTests[i] || { isPrescriptionMatch: false };
      const coverage = this.checkItemCoverage(policy, labTest.name, 'lab', match.isPrescriptionMatch);
      
      if (!coverage.covered) {
        uncoveredLabTests.push(coverage.reason || `Lab test "${labTest.name}" is not covered`);
      }
    }

    if (uncoveredLabTests.length > 0) {
      rejectionReasons.push({
        value: 'benefitNotCovered',
        title: 'Lab tests not covered under policy',
        reasoning: uncoveredLabTests.join('; ')
      });
    }

    // Check each other item against policy
    const uncoveredOthers: string[] = [];
    for (let i = 0; i < invoiceOthers.length; i++) {
      const other = invoiceOthers[i];
      const match = matchingResults.others[i] || { isPrescriptionMatch: false };
      
      // Financial items are auto-approved
      const nameLower = other.name.toLowerCase();
      const isFinancial = nameLower.includes('discount') || 
                         nameLower.includes('gst') || 
                         nameLower.includes('tax') ||
                         nameLower.includes('cgst') ||
                         nameLower.includes('sgst');
      
      if (!isFinancial) {
        const coverage = this.checkItemCoverage(policy, other.name, 'other', match.isPrescriptionMatch);
        
        if (!coverage.covered) {
          uncoveredOthers.push(coverage.reason || `Service "${other.name}" is not covered`);
        }
      }
    }

    if (uncoveredOthers.length > 0) {
      rejectionReasons.push({
        value: 'benefitNotCovered',
        title: 'Services not covered under policy',
        reasoning: uncoveredOthers.join('; ')
      });
    }

    // Check for fraud in digitized documents (if available)
    // This would come from digitization service fraud_analysis

    // Final decision
    const approved = rejectionReasons.length === 0;

    console.log(`[Adjudication] Final decision - Approved: ${approved}, Rejection reasons: ${rejectionReasons.length}`);
    if (rejectionReasons.length > 0) {
      console.log(`[Adjudication] Rejection reasons:`, JSON.stringify(rejectionReasons, null, 2));
    }

    return {
      approved,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
      notes: approved 
        ? 'Adjudication completed successfully - all checks passed' 
        : `Adjudication failed with ${rejectionReasons.length} rejection reason(s)`,
      processedAt: new Date(),
      matchingResults,
      policyValidation,
    };
  }
}

export const adjudicationService = new AdjudicationService();
