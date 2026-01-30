export enum ClaimStatus {
  PENDING = 'pending',
  DIGITIZING = 'digitizing',
  ADJUDICATING = 'adjudicating',
  ADJUDICATED = 'adjudicated',
  SUBMITTED = 'submitted',
}

export interface DigitizedDocument {
  document_type: string;
  document_ids: (string | null)[];
  source_urls: string[];
  total_images: number;
  data: any;
  fraud_analysis?: {
    fake: boolean;
    message: string;
    confidence: string;
    details: Array<{
      type: string;
      status: string;
    }>;
  };
}

export interface DigitizationResponse {
  success: boolean;
  request_id: string;
  data: {
    documents: DigitizedDocument[];
  };
  message: string;
  tokens_used: any;
}

// New input structure
export interface ClaimInput {
  patientDetails: {
    name: string;
  };
  prescriptionsUrls: Array<{ url: string; documentId?: number | string }>;
  invoiceUrls: Array<{ url: string; documentId?: number | string }>;
  supportDocumentsUrl: Array<{ url: string; documentId?: number | string }>; // lab reports
  userRaisedAmount: string;
  requestDate: string;
  policyDocuments: Array<{ policyName: string }>;
}

// Matching results
export interface MedicineMatch {
  index: number;
  name: string;
  isPrescriptionMatch: boolean;
  matchedPrescriptionIndex?: number;
  remark: string;
  reason: string;
  potentialOCRError?: boolean;
  suggestedAlternatives?: string[];
  adjudicatedAmount?: number;
}

export interface LabTestMatch {
  index: number;
  name: string;
  isPrescriptionMatch: boolean;
  isLabReportPresent?: boolean;
  matchedPrescriptionIndex?: number;
  remark: string;
  reason: string;
  potentialOCRError?: boolean;
  suggestedAlternatives?: string[];
  requiresManualReview?: boolean;
  adjudicatedAmount?: number;
}

export interface OthersMatch {
  index: number;
  name: string;
  isPrescriptionMatch: boolean;
  matchedPrescriptionIndex?: number;
  remark: string;
  reason: string;
}

// Policy data structure
export interface PolicyData {
  policy_basic_info: {
    policy_number: string;
    policy_type: string;
    policyholder_name: string;
    insurer_name: string;
    policy_start_date: string;
    policy_end_date: string;
    sum_insured: number;
  };
  policy_coverage: {
    covered_benefits: string[];
    coverage_limits: Array<{
      benefit_name: string;
      limit_amount: number;
      limit_type: string;
      is_sub_limit: boolean;
      parent_benefit: string | null;
    }>;
  };
  policy_exclusions: {
    excluded_conditions: string[];
    waiting_periods: Array<{
      condition: string;
      waiting_period: string;
    }>;
  };
  policy_terms: {
    deductible: number;
    co_payment: number;
    premium_amount: number;
    premium_frequency: string;
  };
  policy_synopsis: {
    key_points: string[];
    important_notes: string[];
  };
}

export interface AdjudicationResult {
  approved: boolean;
  rejectionReasons?: Array<{
    value: string;
    title: string;
    reasoning: string;
  }>;
  notes?: string;
  totalClaimedAmount?: number;
  totalReimbursableAmount?: number;
  aiExplanation?: string;
  processedAt: Date;
  matchingResults?: {
    medicines?: MedicineMatch[];
    labTests?: LabTestMatch[];
    others?: OthersMatch[];
  };
  policyValidation?: {
    isActive: boolean;
    isDateValid: boolean;
    benefitCoverage: boolean;
    coverageLimits: boolean;
  };
}

export interface IClaim {
  _id?: string;
  patientDetails: { name: string };
  prescriptionsUrls: Array<{ url: string; documentId?: number | string }>;
  invoiceUrls: Array<{ url: string; documentId?: number | string }>;
  supportDocumentsUrl: Array<{ url: string; documentId?: number | string }>;
  userRaisedAmount: string;
  requestDate: string;
  policyDocuments: Array<{ policyName: string }>;
  status: ClaimStatus;
  prescriptionData?: any; // Digitized prescription data
  invoiceData?: any; // Digitized invoice data
  labReportData?: any; // Digitized lab report data
  policyName?: string; // Selected policy name
  medicineMatches?: MedicineMatch[];
  labTestMatches?: LabTestMatch[];
  othersMatches?: OthersMatch[];
  adjudicationResult?: AdjudicationResult;
  createdAt?: Date;
  updatedAt?: Date;
}
