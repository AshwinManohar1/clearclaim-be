// Extraction fields for different document types
// Based on README.MD

export const PRESCRIPTION_EXTRACTION_FIELDS = {
  patient_info: {
    patient_name: {
      type: "string",
      description: "Patient's full name as written on prescription",
    },
    prescription_date: {
      type: "date",
      description: "Date when prescription was issued",
    },
  },
  doctor_info: {
    doctor_name: {
      type: "string",
      description: "Doctor's full name",
    },
    doctor_vertical: {
      type: "string",
      description: "Doctor's specialization/vertical",
    }
  },
  medical_info: {
    diagnosis_primary: {
      type: "string",
      description: "Primary diagnosis condition name",
    },
    primary_icd_code: {
      type: "string",
      description: "Primary diagnosis ICD-10 code",
    },
    diagnosis_secondary: {
      type: "array",
      description: "List of secondary diagnosis condition names",
    },
    secondary_diagnosis_icd_code: {
      type: "array",
      description: "List of secondary diagnosis ICD-10 codes",
    },
    clinical_summary: {
      type: "string",
      description: "Clinical summary or notes",
    },
    medicines: {
      type: "array",
      description: "List of prescribed medicines",
    },
    lab_tests: {
      type: "array",
      description: "List of prescribed lab tests",
    },
  },
  clinic_info: {
    clinic_name: {
      type: "string",
      description: "Name of the clinic or hospital",
    },
    clinic_address: {
      type: "string",
      description: "Address of the clinic or hospital",
    },
    clinic_contact_number: {
      type: "array",
      description: "Contact number of the clinic or hospital",
    },
  },
};

export const INVOICE_EXTRACTION_FIELDS = (procedures: any = []) => ({
  reimbursement_type: {
    type: "string",
    description: "Reimbursement type based on services provided",
    enum: procedures,
  },
  invoice_metadata: {
    invoice_number: {
      type: "string",
      description: "Invoice number or bill reference number",
    },
    invoice_date: {
      type: "date",
      description: "Date when the invoice was issued",
    },
    contact_number: {
      type: "array",
      description: "Contact number of the clinic or hospital",
    },
  },
  patient_provider_details: {
    patient_name: {
      type: "string",
      description: "Patient's full name as written on invoice",
    },
    clinic_name: {
      type: "string",
      description: "Name of the hospital, clinic, or healthcare provider",
    },
    clinic_address: {
      type: "string",
      description: "Address of the healthcare provider",
    },
    doctor_name: {
      type: "string",
      description: "Doctor's name (if mentioned on invoice)",
    },
  },
  billing_info: {
    line_items: {
      type: "object",
      description: "Categorized list of services/products grouped by type",
      properties: {
        lab_tests: {
          type: "array",
          description: "List of diagnostic tests and laboratory procedures",
        },
        medicines: {
          type: "array",
          description: "List of medications and pharmaceutical items",
        },
        others: {
          type: "array",
          description: "List of other medical services",
        },
      },
    },
    gross_total: {
      type: "number",
      description: "Gross total amount before adjustments",
    },
    tax_amount: {
      type: "number",
      description: "Tax amount (if any)",
    },
    discount_amount: {
      type: "number",
      description: "Total discount or adjustment amount",
    },
    final_amount: {
      type: "number",
      description: "Final amount paid after all adjustments",
    },
  },
});

export const LAB_REPORT_EXTRACTION_FIELDS = {
  lab_tests: {
    type: "array",
    description: "List of main laboratory test names that would appear on invoices/bills",
    items: {
      type: "string",
      description: "Name of the main laboratory test or test panel",
    },
  },
};
