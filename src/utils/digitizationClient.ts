import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { DigitizationResponse } from '../types';

class DigitizationClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.digitizationApiUrl,
      headers: {
        'Authorization': `Bearer ${env.digitizationApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout
    });
  }

  async extractDocuments(
    documentUrls: string[],
    documentType: string = 'predict',
    detectFraud: boolean = true,
    fields?: any,
    options?: { confidence_threshold?: number }
  ): Promise<DigitizationResponse> {
    try {
      // Format files like src copy does: array of objects with url
      const files = documentUrls.map(url => ({ url }));

      console.log('[DigitizationClient] Sending request:', {
        document_type: documentType,
        detect_fraud: detectFraud,
        files_count: files.length,
        has_fields: !!fields,
      });

      const response = await this.client.post<DigitizationResponse>('', {
        document_type: documentType,
        detect_fraud: detectFraud,
        files: files,
        fields: fields || {},
        options: {
          confidence_threshold: options?.confidence_threshold || 0.7,
        },
      });

      console.log('[DigitizationClient] Response received:', {
        success: response.data.success,
        documents_count: response.data.data?.documents?.length || 0,
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Digitization API error: ${error.response.status} - ${error.response.data?.message || error.message}`
        );
      } else if (error.request) {
        throw new Error('Digitization API request failed: No response received');
      } else {
        throw new Error(`Digitization API error: ${error.message}`);
      }
    }
  }
}

export const digitizationClient = new DigitizationClient();
