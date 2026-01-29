import { digitizationClient } from '../utils/digitizationClient';
import { DigitizationResponse, DigitizedDocument } from '../types';
import { INVOICE_EXTRACTION_FIELDS } from '../constants/extractionFields';

export class DigitizationService {
  /**
   * Extract all documents together (like src copy does)
   * Sends all documents in one call with document_type: "predict"
   * Uses invoice extraction fields for all documents
   */
  async extractAllDocuments(
    prescriptionUrls: Array<{ url: string }>,
    invoiceUrls: Array<{ url: string }>,
    labReportUrls: Array<{ url: string }>,
    procedures: string[] = [],
    detectFraud: boolean = true
  ): Promise<{
    prescriptionData?: any;
    invoiceData?: any;
    labReportData?: any;
  }> {
    try {
      // Combine all URLs (like src copy does)
      const allUrls = [
        ...prescriptionUrls.map(doc => doc.url),
        ...invoiceUrls.map(doc => doc.url),
        ...labReportUrls.map(doc => doc.url),
      ];

      if (allUrls.length === 0) {
        return {};
      }

      // Use invoice extraction fields for all (like src copy does)
      const invoiceFields = INVOICE_EXTRACTION_FIELDS(procedures);

      const response: DigitizationResponse = await digitizationClient.extractDocuments(
        allUrls,
        'predict',
        detectFraud,
        invoiceFields
      );

      if (!response.success) {
        throw new Error(`Document extraction failed: ${response.message || 'Unknown error'}`);
      }

      // Log full response for debugging
      console.log('[DigitizationService] Full API response:', JSON.stringify(response, null, 2));

      // Find documents by type (like src copy does)
      const documents = response.data?.documents || [];
      console.log('[DigitizationService] Documents found:', documents.length);
      console.log('[DigitizationService] Document types:', documents.map((d: any) => d.document_type));
      
      const prescriptionData = documents.find(
        (doc: any) => doc.document_type === 'prescription' || doc.document_type === 'other'
      );
      
      const invoiceData = documents.find(
        (doc: any) => doc.document_type === 'invoice'
      );
      
      const labReportData = documents.find(
        (doc: any) => doc.document_type === 'lab_report'
      );

      console.log('[DigitizationService] Prescription data found:', !!prescriptionData);
      console.log('[DigitizationService] Invoice data found:', !!invoiceData);
      console.log('[DigitizationService] Lab report data found:', !!labReportData);

      return {
        prescriptionData: prescriptionData || undefined,
        invoiceData: invoiceData || undefined,
        labReportData: labReportData || undefined,
      };
    } catch (error: any) {
      console.error('Document extraction error:', error);
      throw new Error(`Failed to extract documents: ${error.message}`);
    }
  }

  /**
   * Digitize prescription documents (legacy - kept for compatibility)
   */
  async digitizePrescriptions(
    prescriptionUrls: Array<{ url: string }>,
    detectFraud: boolean = true
  ): Promise<DigitizedDocument[]> {
    try {
      const urls = prescriptionUrls.map(doc => doc.url);
      const response: DigitizationResponse = await digitizationClient.extractDocuments(
        urls,
        'predict',
        detectFraud,
        INVOICE_EXTRACTION_FIELDS([]) // Use invoice fields
      );

      if (!response.success) {
        throw new Error(`Prescription digitization failed: ${response.message || 'Unknown error'}`);
      }

      return response.data.documents.filter(doc => doc.document_type === 'prescription' || doc.document_type === 'other');
    } catch (error: any) {
      console.error('Prescription digitization error:', error);
      throw new Error(`Failed to digitize prescriptions: ${error.message}`);
    }
  }

  /**
   * Digitize invoice documents (legacy - kept for compatibility)
   */
  async digitizeInvoices(
    invoiceUrls: Array<{ url: string }>,
    detectFraud: boolean = true,
    procedures: string[] = []
  ): Promise<DigitizedDocument[]> {
    try {
      const urls = invoiceUrls.map(doc => doc.url);
      const invoiceFields = INVOICE_EXTRACTION_FIELDS(procedures);
      const response: DigitizationResponse = await digitizationClient.extractDocuments(
        urls,
        'predict',
        detectFraud,
        invoiceFields
      );

      if (!response.success) {
        throw new Error(`Invoice digitization failed: ${response.message || 'Unknown error'}`);
      }

      return response.data.documents.filter(doc => doc.document_type === 'invoice');
    } catch (error: any) {
      console.error('Invoice digitization error:', error);
      throw new Error(`Failed to digitize invoices: ${error.message}`);
    }
  }

  /**
   * Digitize lab report documents (legacy - kept for compatibility)
   */
  async digitizeLabReports(
    labReportUrls: Array<{ url: string }>,
    detectFraud: boolean = true
  ): Promise<DigitizedDocument[]> {
    try {
      if (!labReportUrls || labReportUrls.length === 0) {
        return [];
      }

      const urls = labReportUrls.map(doc => doc.url);
      const response: DigitizationResponse = await digitizationClient.extractDocuments(
        urls,
        'predict',
        detectFraud,
        INVOICE_EXTRACTION_FIELDS([]) // Use invoice fields
      );

      if (!response.success) {
        throw new Error(`Lab report digitization failed: ${response.message || 'Unknown error'}`);
      }

      return response.data.documents.filter(doc => doc.document_type === 'lab_report' || doc.document_type === 'other');
    } catch (error: any) {
      console.error('Lab report digitization error:', error);
      throw new Error(`Failed to digitize lab reports: ${error.message}`);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async digitizeDocuments(
    documentUrls: string[],
    documentType: string = 'predict',
    detectFraud: boolean = true
  ): Promise<DigitizedDocument[]> {
    try {
      const response: DigitizationResponse = await digitizationClient.extractDocuments(
        documentUrls,
        documentType,
        detectFraud
      );

      if (!response.success) {
        throw new Error(`Digitization failed: ${response.message || 'Unknown error'}`);
      }

      return response.data.documents;
    } catch (error: any) {
      console.error('Digitization error:', error);
      throw new Error(`Failed to digitize documents: ${error.message}`);
    }
  }
}

export const digitizationService = new DigitizationService();
