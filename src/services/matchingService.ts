import { chatCompletion } from '../utils/openai';
import {
  MEDICINE_MATCHING_SYSTEM_PROMPT,
  buildMedicineMatchingPrompt,
} from '../prompts/medicineMatchingPrompts';
import {
  LAB_REPORT_MATCHING_SYSTEM_PROMPT,
  buildLabReportMatchingPrompt,
} from '../prompts/labTestMatchingPrompts';
import {
  OTHERS_MATCHING_SYSTEM_PROMPT,
  buildOthersMatchingPrompt,
} from '../prompts/othersMatchingPrompts';
import { MedicineMatch, LabTestMatch, OthersMatch } from '../types';

export class MatchingService {
  /**
   * Match invoice medicines with prescription medicines
   */
  async matchMedicines(
    invoiceMedicines: any[],
    prescriptionMedicines: any[]
  ): Promise<MedicineMatch[]> {
    try {
      if (!invoiceMedicines || invoiceMedicines.length === 0) {
        return [];
      }

      if (!prescriptionMedicines || prescriptionMedicines.length === 0) {
        // No prescription medicines - all invoice medicines fail
        return invoiceMedicines.map((med: any, idx: number) => ({
          index: idx,
          name: med.name,
          isPrescriptionMatch: false,
          remark: 'No prescription medicines found',
          reason: 'No medicines found in prescription to match against',
        }));
      }

      // Prepare minimal data for matching
      const minimalInvoice = invoiceMedicines.map((med: any, idx: number) => ({
        index: idx,
        name: med.name,
        unit_cost: med.unit_cost,
        quantity: med.quantity,
      }));

      const minimalPrescription = prescriptionMedicines.map((med: any, idx: number) => ({
        index: idx,
        name: med.medicine_name,
        dosage: med.medicine_dosage,
      }));

      const userPrompt = buildMedicineMatchingPrompt(minimalInvoice, minimalPrescription);

      const messages = [
        {
          role: 'system',
          content: MEDICINE_MATCHING_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ];

      const result = await chatCompletion(messages as any);

      if (!result.success) {
        console.error('Medicine matching failed:', result.error);
        // Return all as unmatched on error
        return invoiceMedicines.map((med: any, idx: number) => ({
          index: idx,
          name: med.name,
          isPrescriptionMatch: false,
          remark: 'Matching error',
          reason: result.error || 'Failed to match medicines',
        }));
      }

      // Parse JSON response
      let parsed: MedicineMatch[];
      try {
        let content = result.content?.trim() || '[]';
        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(content);
      } catch (parseError: any) {
        console.error('Failed to parse medicine matching response:', parseError);
        // Return all as unmatched on parse error
        return invoiceMedicines.map((med: any, idx: number) => ({
          index: idx,
          name: med.name,
          isPrescriptionMatch: false,
          remark: 'Parse error',
          reason: 'Failed to parse matching results',
        }));
      }

      return parsed;
    } catch (error: any) {
      console.error('Medicine matching error:', error);
      // Return all as unmatched on error
      return invoiceMedicines.map((med: any, idx: number) => ({
        index: idx,
        name: med.name,
        isPrescriptionMatch: false,
        remark: 'Error',
        reason: error.message || 'Unknown error during matching',
      }));
    }
  }

  /**
   * Match invoice lab tests with prescription lab tests and lab report data
   */
  async matchLabTests(
    invoiceLabTests: any[],
    prescriptionLabTests: any[],
    labReportData: any
  ): Promise<LabTestMatch[]> {
    try {
      if (!invoiceLabTests || invoiceLabTests.length === 0) {
        return [];
      }

      // Prepare minimal data for matching
      const minimalInvoice = invoiceLabTests.map((test: any, idx: number) => ({
        index: idx,
        name: test.name,
        unit_cost: test.unit_cost,
        quantity: test.quantity,
      }));

      const minimalPrescription = (prescriptionLabTests || []).map((test: any, idx: number) => ({
        index: idx,
        name: test,
      }));

      const userPrompt = buildLabReportMatchingPrompt(
        minimalInvoice,
        minimalPrescription,
        labReportData
      );

      const messages = [
        {
          role: 'system',
          content: LAB_REPORT_MATCHING_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ];

      const result = await chatCompletion(messages as any);

      if (!result.success) {
        console.error('Lab test matching failed:', result.error);
        // Return all as unmatched on error
        return invoiceLabTests.map((test: any, idx: number) => ({
          index: idx,
          name: test.name,
          isPrescriptionMatch: false,
          isLabReportPresent: false,
          remark: 'Matching error',
          reason: result.error || 'Failed to match lab tests',
        }));
      }

      // Parse JSON response
      let parsed: LabTestMatch[];
      try {
        let content = result.content?.trim() || '[]';
        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(content);
      } catch (parseError: any) {
        console.error('Failed to parse lab test matching response:', parseError);
        // Return all as unmatched on parse error
        return invoiceLabTests.map((test: any, idx: number) => ({
          index: idx,
          name: test.name,
          isPrescriptionMatch: false,
          isLabReportPresent: false,
          remark: 'Parse error',
          reason: 'Failed to parse matching results',
        }));
      }

      return parsed;
    } catch (error: any) {
      console.error('Lab test matching error:', error);
      // Return all as unmatched on error
      return invoiceLabTests.map((test: any, idx: number) => ({
        index: idx,
        name: test.name,
        isPrescriptionMatch: false,
        isLabReportPresent: false,
        remark: 'Error',
        reason: error.message || 'Unknown error during matching',
      }));
    }
  }

  /**
   * Match invoice other items with prescription details
   */
  async matchOthers(
    invoiceOthers: any[],
    prescriptionDetails: any
  ): Promise<OthersMatch[]> {
    try {
      if (!invoiceOthers || invoiceOthers.length === 0) {
        return [];
      }

      // Prepare minimal data for matching
      const minimalInvoice = invoiceOthers.map((item: any, idx: number) => ({
        index: idx,
        name: item.name,
        unit_cost: item.unit_cost,
        quantity: item.quantity,
      }));

      const minimalPrescription = {
        diagnosis: prescriptionDetails?.medical_info?.diagnosis_primary || '',
        clinical_summary: prescriptionDetails?.medical_info?.clinical_summary || '',
      };

      const userPrompt = buildOthersMatchingPrompt(minimalInvoice, minimalPrescription);

      const messages = [
        {
          role: 'system',
          content: OTHERS_MATCHING_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ];

      const result = await chatCompletion(messages as any);

      if (!result.success) {
        console.error('Others matching failed:', result.error);
        // Return all as unmatched on error
        return invoiceOthers.map((item: any, idx: number) => ({
          index: idx,
          name: item.name,
          isPrescriptionMatch: false,
          remark: 'Matching error',
          reason: result.error || 'Failed to match items',
        }));
      }

      // Parse JSON response
      let parsed: OthersMatch[];
      try {
        let content = result.content?.trim() || '[]';
        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(content);
      } catch (parseError: any) {
        console.error('Failed to parse others matching response:', parseError);
        // Return all as unmatched on parse error
        return invoiceOthers.map((item: any, idx: number) => ({
          index: idx,
          name: item.name,
          isPrescriptionMatch: false,
          remark: 'Parse error',
          reason: 'Failed to parse matching results',
        }));
      }

      return parsed;
    } catch (error: any) {
      console.error('Others matching error:', error);
      // Return all as unmatched on error
      return invoiceOthers.map((item: any, idx: number) => ({
        index: idx,
        name: item.name,
        isPrescriptionMatch: false,
        remark: 'Error',
        reason: error.message || 'Unknown error during matching',
      }));
    }
  }
}

export const matchingService = new MatchingService();
