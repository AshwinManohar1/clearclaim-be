import { Claim, IClaimDocument } from '../models/Claim';
import { ClaimStatus, IClaim, ClaimInput } from '../types';
import { digitizationService } from './digitizationService';
import { adjudicationService } from './adjudicationService';
import { matchingService } from './matchingService';
import { getPolicyData } from '../data/policies';

export class ClaimService {
  async createClaim(claimInput: ClaimInput): Promise<IClaimDocument> {
    // Validate policy name
    const policyName = claimInput.policyDocuments[0]?.policyName;
    if (!policyName) {
      throw new Error('Policy name is required');
    }

    const policy = getPolicyData(policyName);
    if (!policy) {
      throw new Error(`Invalid policy name: ${policyName}. Must be "Niva Bupa" or "Aditya Birla Health Insurance"`);
    }

    const claim = new Claim({
      ...claimInput,
      status: ClaimStatus.PENDING,
      policyName,
    });

    const savedClaim = await claim.save();

    // Trigger background processing
    setImmediate(() => {
      this.processClaimInBackground(savedClaim._id.toString()).catch((error) => {
        console.error(`Background processing failed for claim ${savedClaim._id}:`, error);
      });
    });

    return savedClaim;
  }

  async getAllClaims(page: number = 1, limit: number = 10): Promise<{
    claims: IClaimDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      Claim.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Claim.countDocuments().exec(),
    ]);

    return {
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getClaimById(id: string): Promise<IClaimDocument | null> {
    return Claim.findById(id).exec();
  }

  async updateClaim(
    id: string,
    updates: Partial<IClaim>
  ): Promise<IClaimDocument | null> {
    return Claim.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async submitClaim(id: string): Promise<IClaimDocument | null> {
    const claim = await this.getClaimById(id);

    if (!claim) {
      throw new Error('Claim not found');
    }

    if (claim.status !== ClaimStatus.ADJUDICATED) {
      throw new Error(`Claim must be in 'adjudicated' status to submit. Current status: ${claim.status}`);
    }

    return this.updateClaim(id, { status: ClaimStatus.SUBMITTED });
  }

  private async processClaimInBackground(claimId: string): Promise<void> {
    try {
      // Update status to digitizing
      await this.updateClaim(claimId, { status: ClaimStatus.DIGITIZING });

      // Get the claim
      const claim = await this.getClaimById(claimId);
      if (!claim) {
        throw new Error('Claim not found during processing');
      }

      // Step 1: Digitize all documents together (like src copy does)
      console.log(`[Claim ${claimId}] Starting digitization...`);
      
      const extractionResult = await digitizationService.extractAllDocuments(
        claim.prescriptionsUrls,
        claim.invoiceUrls,
        claim.supportDocumentsUrl,
        [] // procedures - empty for now
      );

      // Extract data from documents
      // The data structure from API: document.data contains the extracted fields
      const prescriptionData = extractionResult.prescriptionData?.data || extractionResult.prescriptionData;
      const invoiceData = extractionResult.invoiceData?.data || extractionResult.invoiceData;
      const labReportData = extractionResult.labReportData?.data || extractionResult.labReportData || null;

      // Log raw extraction results for debugging
      console.log(`[Claim ${claimId}] Raw extraction result:`, JSON.stringify(extractionResult, null, 2));

      // Log all extracted data for debugging
      console.log(`[Claim ${claimId}] ========== EXTRACTED DATA ==========`);
      console.log(`[Claim ${claimId}] Prescription Data:`, JSON.stringify(prescriptionData, null, 2));
      console.log(`[Claim ${claimId}] Invoice Data:`, JSON.stringify(invoiceData, null, 2));
      console.log(`[Claim ${claimId}] Lab Report Data:`, JSON.stringify(labReportData, null, 2));
      console.log(`[Claim ${claimId}] ====================================`);

      // Update claim with digitized data
      await this.updateClaim(claimId, {
        prescriptionData,
        invoiceData,
        labReportData,
        status: ClaimStatus.ADJUDICATING,
      });

      console.log(`[Claim ${claimId}] Digitization complete, starting matching...`);

      // Step 2: Run matching
      const invoiceMedicines = invoiceData?.billing_info?.line_items?.medicines || [];
      const invoiceLabTests = invoiceData?.billing_info?.line_items?.lab_tests || [];
      const invoiceOthers = invoiceData?.billing_info?.line_items?.others || [];
      const prescriptionMedicines = prescriptionData?.medical_info?.medicines || [];
      const prescriptionLabTests = prescriptionData?.medical_info?.lab_tests || [];

      // Log extracted line items
      console.log(`[Claim ${claimId}] ========== LINE ITEMS ==========`);
      console.log(`[Claim ${claimId}] Invoice Medicines (${invoiceMedicines.length}):`, JSON.stringify(invoiceMedicines, null, 2));
      console.log(`[Claim ${claimId}] Invoice Lab Tests (${invoiceLabTests.length}):`, JSON.stringify(invoiceLabTests, null, 2));
      console.log(`[Claim ${claimId}] Invoice Others (${invoiceOthers.length}):`, JSON.stringify(invoiceOthers, null, 2));
      console.log(`[Claim ${claimId}] Prescription Medicines (${prescriptionMedicines.length}):`, JSON.stringify(prescriptionMedicines, null, 2));
      console.log(`[Claim ${claimId}] Prescription Lab Tests (${prescriptionLabTests.length}):`, JSON.stringify(prescriptionLabTests, null, 2));
      console.log(`[Claim ${claimId}] ====================================`);

      const [medicineMatches, labTestMatches, othersMatches] = await Promise.all([
        matchingService.matchMedicines(invoiceMedicines, prescriptionMedicines),
        matchingService.matchLabTests(invoiceLabTests, prescriptionLabTests, labReportData?.lab_tests),
        matchingService.matchOthers(invoiceOthers, prescriptionData),
      ]);

      // Log matching results
      console.log(`[Claim ${claimId}] ========== MATCHING RESULTS ==========`);
      console.log(`[Claim ${claimId}] Medicine Matches (${medicineMatches.length}):`, JSON.stringify(medicineMatches, null, 2));
      console.log(`[Claim ${claimId}] Lab Test Matches (${labTestMatches.length}):`, JSON.stringify(labTestMatches, null, 2));
      console.log(`[Claim ${claimId}] Others Matches (${othersMatches.length}):`, JSON.stringify(othersMatches, null, 2));
      console.log(`[Claim ${claimId}] ======================================`);

      // Update claim with matching results
      await this.updateClaim(claimId, {
        medicineMatches,
        labTestMatches,
        othersMatches,
      });

      console.log(`[Claim ${claimId}] Matching complete, starting adjudication...`);

      // Step 3: Run adjudication
      const adjudicationResult = await adjudicationService.adjudicate(
        prescriptionData,
        invoiceData,
        labReportData,
        claim.policyName!,
        {
          medicines: medicineMatches,
          labTests: labTestMatches,
          others: othersMatches,
        }
      );

      // Update claim with adjudication result
      await this.updateClaim(claimId, {
        adjudicationResult,
        status: ClaimStatus.ADJUDICATED,
      });

      console.log(`[Claim ${claimId}] Processing complete. Approved: ${adjudicationResult.approved}`);
    } catch (error: any) {
      console.error(`Error processing claim ${claimId}:`, error);
      // Update claim status to indicate error
      await this.updateClaim(claimId, {
        status: ClaimStatus.PENDING, // Reset to pending on error
      });
      throw error;
    }
  }
}

export const claimService = new ClaimService();
