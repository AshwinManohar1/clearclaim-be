const MEDICAL_SPECIALTIES = [
  "Psychologist",
  "Dermatologist",
  "General Physician",
  "Nutritionist",
  "Gynaecologist",
  "Sexologist",
  "Health and Wellness",
  "Cardiologist",
  "Paediatrician",
  "Diabetologist",
  "Dentist",
  "Endocrinologist",
  "ENT",
  "Gastroenterologist",
  "Oncologist",
  "Nephrologist",
  "Neurologist",
  "Ophthalmologist",
  "Orthopaedics",
  "Physiotherapist",
  "Psychiatrist",
  "Pulmonologist",
  "Rheumatologist",
  "Urologist",
  "Radiologist",
  "Neuro Surgeon",
  "General Surgeon",
  "Homeopathy",
  "Financial Advisor",
  "Legal Advisor",
  "Internal Medicine",
  "Covid19",
  "Plastic Surgeon",
  "Veterinary ",
  "Ayurvedic",
  "Unani",
  "Vascular & Endovascular Surgery",
  "Hematologist",
  "Hepatologist",
  "Sonologist",
  "Fetal Medicine",
  "Pain and Palliative medicine",
  "Andrologist",
  "Optometrist",
  "Gym Membership",
  "Health Checkup",
  "Vaccination",
  "Infectious diseases",
  "Hemato-oncology",
  "Anaesthesia",
  "Sports medicine",
  "Emergency Medicine",
  "Hematology",
  "Microbiology",
  "Palliative Medicine",
  "Pathology",
  "Transfusion Medicine",
  "Critical Medicine",
  "Intensive care medicine",
  "Yoga Trainer",
]


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
    "doctor_vertical": {
      "type": "string",
      "description": "Doctor's specialization/vertical. Choose from the predefined list of medical specialties. If the exact specialty is not in the list, choose the closest match or 'General Physician' as default.",
      "enum": MEDICAL_SPECIALTIES
    }
  },
  medical_info: {
    "diagnosis_primary": {
      "type": "string",
      "description": "Primary diagnosis condition name as written in the diagnosis section. Look for terms under 'Diagnosis', 'Impression', 'Assessment', 'Final Diagnosis', or 'ADVICE' sections. Extract exact text as written (e.g., 'URI', 'Hypertension', 'Type 2 Diabetes'). Do not expand abbreviations unless explicitly written in full form.",
    },
    "primary_icd_code": {
      "type": "string",
      "description": "Primary diagnosis ICD-10 code. If explicitly mentioned in the document, extract the exact code (e.g., 'J06.9', 'I10', 'E11.9'). If no ICD code is mentioned, generate the appropriate ICD-10 code based on the primary diagnosis condition. Ensure the generated code matches the diagnosis accurately.",
    },
    "diagnosis_secondary": {
      "type": "array",
      "description": "List of secondary diagnosis condition names as written in the document. Look for additional diagnoses beyond the primary one, often listed as 'Secondary Diagnosis', 'Other Diagnoses', or multiple conditions in the diagnosis section. Extract exact text as written.",
    },
    "secondary_diagnosis_icd_code": {
      "type": "array",
      "description": "List of secondary diagnosis ICD-10 codes. If explicitly mentioned in the document, extract the exact codes. If no ICD codes are mentioned, generate appropriate ICD-10 codes based on the secondary diagnosis conditions. Ensure the generated codes match the diagnoses accurately.",
    },
    clinical_summary: {
      type: "string",
      description: "Clinical summary or notes",
    },
    medicines: {
      type: "array",
      description: "List of prescribed medicines with detailed information",
      items: {
        type: "object",
        properties: {
          medicine_name: {
            type: "string",
            description: "Name of the prescribed medicine",
          },
          medicine_dosage: {
            type: "string",
            description:
              "Dosage of the medicine (e.g., '500mg', '10ml'). Use null if not visible",
          },
          frequency: {
            type: "string",
            description:
              "Frequency of medicine intake. Choose from predefined options. Use 'other' if the frequency doesn't match any option. Use null if not visible",
            enum: [
              "once a day in the morning",
              "once a day in afternoon",
              "once a day in the evening",
              "twice a day once in morning and evening",
              "three times a day morning, afternoon and evening",
              "four times a day",
              "five times a day",
              "once a week",
              "twice a week",
              "alternate day",
              "sos",
              "other",
            ],
          },
          duration: {
            type: "string",
            description:
              "Duration number (e.g., 7, 2, 1). Use null if not visible",
          },
          duration_type: {
            type: "string",
            description: "Duration type: 'days', 'weeks', or 'months'. Use null if not visible",
          },
          timing_of_dosage: {
            type: "string",
            description:
              "When the medicine should be taken in relation to food.Use null if timing is not specified.",
            enum: ["Before Food", "After Food"],
          },
        },
      },
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
      description:
        "Contact number of the clinic or hospital as strings (not numbers). Each phone number should be a string in quotes.",
    },
  },
};

export const INVOICE_EXTRACTION_FIELDS = (procedures: any) => ({
  reimbursement_type: {
    type: "string",
    description:
      "Analyze the bill/invoice content and return the reimbursement type that best match the services or treatments provided. Select from the available options based on the procedures, medications, or services mentioned in the document.For eg: If it's a dental procedure, choose the specific dental treatment type.",
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
      description:
        "Contact number of the clinic or hospital as strings (not numbers). Each phone number should be a string in quotes.",
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
          description: "List of ALL unique diagnostic tests, laboratory procedures, and imaging studies (X-ray, USG, MRI, CT, blood tests, pathology tests, etc.) aggregated from ALL processed invoices. Merge only exact duplicates (same name and unit cost) by summing quantity and total. If prices differ, keep as separate items.",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "description": "Name of the diagnostic test or lab procedure (e.g., 'USG-Whole Abdomen', 'X-ray-Chest', 'Complete Blood Count')"
              },
              "unit_cost": {
                "type": "number",
                "description": "Cost per unit of the test/procedure"
              },
              "quantity": {
                "type": "number",
                "description": "Number of units/quantity of the test/procedure (usually 1 for diagnostic tests)"
              },
              "total": {
                "type": "number",
                "description": "Total cost for this test/procedure (unit_cost × quantity)"
              }
            }
          }
        },
        medicines: {
          type: "array",
          "description": "List of ALL unique medications, pharmaceutical items, drugs, tablets, syrups, injections, medical supplies, or health products aggregated from ALL processed invoices. Merge only exact duplicates (same name and unit cost) by summing quantity and total. If prices differ, keep as separate items.",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "description": "Name of the medicine or pharmaceutical item"
              },
              "unit_cost": {
                "type": "number",
                "description": "Cost per unit of the medicine"
              },
              "quantity": {
                "type": "number",
                "description": "Number of units/quantity of the medicine"
              },
              "total": {
                "type": "number",
                "description": "Total cost for this medicine (unit_cost × quantity)"
              }
            }
          }
        },
        others: {
          type: "array",
          "description": "List of ALL unique other medical services (consultation fees, room charges, nursing charges, equipment charges, administrative fees, discounts, etc.) aggregated from ALL processed invoices. Merge only exact duplicates (same name and unit cost) by summing quantity and total. If prices differ, keep as separate items. IMPORTANT: Include discounts as negative line items (e.g., 'Discount' with negative unit_cost and total values).",          
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "description": "Name of the other medical service or charge"
              },
              "unit_cost": {
                "type": "number",
                "description": "Cost per unit of the service"
              },
              "quantity": {
                "type": "number",
                "description": "Number of units/quantity of the service"
              },
              "total": {
                "type": "number",
                "description": "Total cost for this service (unit_cost × quantity)"
              }
            }
          }
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

export const POLICY_EXTRACTION_FIELDS = {
  "policy_basic_info": {
    "policy_number": {
      "type": "string",
      "description": "Policy number or reference number as mentioned in the document"
    },
    "policy_type": {
      "type": "string",
      "description": "Type of insurance policy (e.g., 'Health Insurance', 'Life Insurance', 'Motor Insurance', 'Travel Insurance')"
    },
    "policyholder_name": {
      "type": "string",
      "description": "Name of the policyholder/insured person"
    },
    "insurer_name": {
      "type": "string",
      "description": "Name of the insurance company"
    },
    "policy_start_date": {
      "type": "date",
      "description": "Policy start date or effective date"
    },
    "policy_end_date": {
      "type": "date",
      "description": "Policy end date or expiry date"
    },
    "sum_insured": {
      "type": "number",
      "description": "Total sum insured amount"
    }
  },
  "policy_coverage": {
    "covered_benefits": {
      "type": "array",
      "description": "List of benefits covered under the policy (e.g., 'Hospitalization', 'OPD', 'Pre-existing conditions', 'Maternity')",
      "items": {
        "type": "string"
      }
    },
    "coverage_limits": {
      "type": "array",
      "description": "List of coverage limits and sub-limits with amounts. Extract BOTH main limits AND their detailed sub-limits when present. For example: if main limit is 'OPD Treatment - 10,000' with sub-limits 'Diagnostics - 5,000' and 'Pharmacy - 5,000', extract ALL of them. Look for detailed breakdowns in policy tables, schedules, and fine print. Include limit types like 'per year', 'within total sum insured', 'of OPD sum insured', etc.",
      "items": {
        "type": "object",
        "properties": {
          "benefit_name": {
            "type": "string",
            "description": "Name of the benefit or coverage (e.g., 'Out-Patient Treatment Cover', 'Prescribed OPD Diagnostics', 'Dental Wellness')"
          },
          "limit_amount": {
            "type": "number",
            "description": "Coverage limit amount in numeric value"
          },
          "limit_type": {
            "type": "string",
            "description": "Type of limit (e.g., 'per year', 'per claim', 'lifetime', 'within total sum insured', 'of OPD sum insured', 'per policy period'). If not specified, use 'per year' as default."
          },
          "is_sub_limit": {
            "type": "boolean",
            "description": "Whether this is a sub-limit (true) or main limit (false). Sub-limits are specific breakdowns within a main benefit (e.g., 'Diagnostics - 5,000' is a sub-limit of 'OPD Treatment - 10,000')."
          },
          "parent_benefit": {
            "type": "string",
            "description": "Parent benefit name if this is a sub-limit (e.g., 'Out-Patient Treatment Cover' for 'Prescribed OPD Diagnostics'). Leave null for main limits."
          }
        }
      }
    }
  },
  "policy_exclusions": {
    "excluded_conditions": {
      "type": "array",
      "description": "List of conditions, treatments, or situations excluded from coverage",
      "items": {
        "type": "string"
      }
    },
    "waiting_periods": {
      "type": "array",
      "description": "List of waiting periods for specific conditions or treatments",
      "items": {
        "type": "object",
        "properties": {
          "condition": {
            "type": "string",
            "description": "Condition or treatment"
          },
          "waiting_period": {
            "type": "string",
            "description": "Waiting period duration (e.g., '2 years', '90 days')"
          }
        }
      }
    }
  },
  "policy_terms": {
    "deductible": {
      "type": "number",
      "description": "Deductible amount if applicable"
    },
    "co_payment": {
      "type": "number",
      "description": "Co-payment percentage if applicable"
    },
    "premium_amount": {
      "type": "number",
      "description": "Premium amount"
    },
    "premium_frequency": {
      "type": "string",
      "description": "Premium payment frequency (e.g., 'Monthly', 'Yearly', 'Quarterly')"
    }
  },
  "policy_synopsis": {
    "key_points": {
      "type": "array",
      "description": "Key points from the policy that are important for claim adjudication. Include any clauses, conditions, or terms that could affect claim approval, rejection, or processing.",
      "items": {
        "type": "string"
      }
    },
    "important_notes": {
      "type": "array",
      "description": "Important notes, conditions, or special clauses from the policy",
      "items": {
        "type": "string"
      }
    }
  }
};

export const LAB_REPORT_EXTRACTION_FIELDS = {
  lab_tests: {
    type: "array",
    description:
      "List of main laboratory test names that would appear on invoices/bills. Extract test panels and comprehensive tests (e.g., 'Complete Blood Picture', 'Lipid Profile'). Do NOT include individual parameters that are part of larger tests (e.g., 'Hemoglobin', 'WBC Count' are parameters of 'Complete Blood Picture'). Focus on billable test names as written in the report.",
    items: {
      type: "string",
      description:
        "Name of the main laboratory test or test panel that would be billed separately",
    },
  },
};


export const REJECTION_REASONS = [
  {
    title: "Patient is not covered under policy",
    value: "patientNotCovered",
  },
  {
    title: "Invoice date is before policy start date",
    value: "invoiceBeforePolicyDate",
  },
  {
    title: "Invoice already submitted in another claim",
    value: "invoiceInAnotherClaim",
  },
  {
    title: "Policy is not active",
    value: "policyNotActive",
  },
  {
    title: "Sum Insured Exhausted",
    value: "sumInsuredExhausted",
  },
  {
    title: "Documents uploaded are not as per the norms",
    value: "documentUploadedNotAsPerNorm",
  },
  {
    title: "Benefit is not covered in policy",
    value: "benefitNotCovered",
  },
  {
    title:
      "Already approved medication/labs as advised for respective prescription in earlier claim",
    value: "AlreadyApprovedMedOrLabs",
  },
  {
    title: "Prescription has crossed its validity period",
    value: "PrescriptionValidityCrossed",
  },
  {
    title:
      "Prescription / Lab reports are from the insurer's NON- Preferred Hospital/ Diagnostic Centre List",
    value: "blackListedHospitalOrDiagnostic",
  },
  {
    title: "Sub-limit for respective benefit category is exhausted",
    value: "SubLimitBenefitExhausted",
  },
  {
    title: "Claim closed due to invalid bank details",
    value: "InvalidBankDetails",
  },
  {
    title: "Only 50% consumption of wallet is allowed",
    value: "fiftyPercentageWalletAllowed",
  },
  {
    title: "Cashless benefit availed for the claim",
    value: "CashlessBenefitAvailed",
  },
  {
    title: "Invoice date falls outside the 30-day submission window",
    value: "invoiceDateInvalid",
  },
];



//curl:
curl --location 'https://zyvelor-document-extractor-uat.ambitiousstone-b2402989.centralindia.azurecontainerapps.io/api/extract' \
--header 'Authorization: Bearer your_digitization_api_key_here' \
--header 'Content-Type: application/json' \
--data '{
    "document_type": "predict",
    "detect_fraud": true,
    "files": [
        {
            "url": "https://api.getvisitapp.com/v3/reimbursements/6091928/b3c6b0f793da7964b3445253c94c593a.jpg"
        },
        {
            "url": "https://api.getvisitapp.com/v3/reimbursements/6091928/fff150710134ad80526827b5b5a94990.jpg"
        }
    ],
    "fields": {
        
    },
    "options": {
        "confidence_threshold": 0.7
    }
}'


Note: use type predict for documents type other than policy . rest all the docs are type predict . 

//response:

{
    "success": true,
    "request_id": "697bb67e75edde9e47bc136b",
    "data": {
        "documents": [
            {
                "document_type": "invoice",
                "document_ids": [
                    null
                ],
                "source_urls": [
                    "https://api.getvisitapp.com/v3/reimbursements/6091928/b3c6b0f793da7964b3445253c94c593a.jpg"
                ],
                "total_images": 1,
                "data": {
                    "patient_info": {
                        "patient_name": "Jaswanth Nanduri",
                        "prescription_date": "2026-06-20"
                    },
                    "doctor_info": {
                        "doctor_name": "",
                        "doctor_signature_present": false,
                        "doctor_stamp_present": false,
                        "doctor_reg_no": "",
                        "doctor_vertical": "General Physician"
                    },
                    "medical_info": {
                        "diagnosis_primary": "",
                        "primary_icd_code": "",
                        "diagnosis_secondary": [],
                        "secondary_diagnosis_icd_code": [],
                        "clinical_summary": "",
                        "medicines": [],
                        "lab_tests": []
                    },
                    "clinic_info": {
                        "clinic_name": "Apollo Hospitals",
                        "clinic_address": "Opposite IIMB, 154/11, Amalodbhavi Nagar, Panduranga Nagar, Bangalore-560076",
                        "clinic_contact_number": [
                            "+91-80-26304050",
                            "+91-80-26304051"
                        ]
                    }
                },
                "fraud_analysis": {
                    "fake": true,
                    "message": "Possible tampering detected: Possible image editing or manipulation.",
                    "confidence": "MEDIUM",
                    "details": [
                        {
                            "type": "fraud_signals_image_manipulation",
                            "status": "POSSIBLE_IMAGE_MANIPULATION"
                        }
                    ]
                }
            },
            {
                "document_type": "other",
                "document_ids": [
                    null
                ],
                "source_urls": [
                    "https://api.getvisitapp.com/v3/reimbursements/6091928/fff150710134ad80526827b5b5a94990.jpg"
                ],
                "total_images": 1,
                "data": {
                    "document_info": {
                        "type": "object",
                        "description": "General document information and metadata"
                    },
                    "content": {
                        "type": "object",
                        "description": "Main document content and details",
                        "data": {
                            "clinic_name": "Apollo 247",
                            "doctor_name": "Dr. Nitish Kumar",
                            "doctor_qualification": "MBBS",
                            "doctor_specialization": "Family Physician",
                            "doctor_registration_number": "98037",
                            "clinic_address": "SX-397, Aves Van Colony",
                            "clinic_contact": "+91 80471 04009",
                            "clinic_email": "Helpdesk@apollo247.com",
                            "patient_name": "Jaswanth Nanduri",
                            "patient_gender": "Male",
                            "patient_age": "23",
                            "patient_contact": "9491259699",
                            "consult_date": "2025-06-20",
                            "consult_type": "Patient",
                            "uhid": "AP31.0008521596",
                            "appointment_id": "3948447",
                            "chief_complaints": [
                                "MRI Scanning"
                            ]
                        }
                    }
                },
                "fraud_analysis": {
                    "fake": true,
                    "message": "Possible tampering detected: Possible image editing or manipulation.",
                    "confidence": "MEDIUM",
                    "details": [
                        {
                            "type": "fraud_signals_image_manipulation",
                            "status": "POSSIBLE_IMAGE_MANIPULATION"
                        }
                    ]
                }
            }
        ]
    },
    "message": "",
    "tokens_used": {}
}



{
        "reimbursementId": "3263837",
        "userId": 5970185,
        "uniqueJobId": "34062a6ec6f648f19732857d893574bbca",
        "patientDetails": {
            "name": "Bikash Ranjan",
        },
        "prescriptionsUrls": [
            {
                "url": "https://visit-user-uploads-prod-mum.s3.ap-south-1.amazonaws.com/5970185/reimbursements/62348af81751eed418ca60f71cbf5ea4.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA6MR3BLFQDUTYQZL7%2F20260129%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260129T075415Z&X-Amz-Expires=7200&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmFwLXNvdXRoLTEiRzBFAiEA2IZvP6H9uV57SxsD0in45UI01LN%2Fu2xYxCe0%2BJmLwMECIDM4kzA3ucpgGIUH0yz8uXMx%2FnQT%2BBZDxm5A%2FWJTxHcfKscFCIH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMOTg5MDQwMDQwMjg4Igy4wxtp2F5VF2EuZRAqmwUu6lEyjwg5Xgq9XLT29XO2tIHlBL%2BJOGVpFf3tlNyvYwDNEGFM5QDNmv59hDdvuIpU7LsuuQjeh%2FkZrd6aCmLuCaqubzc6iU89B5VDydFBWW65fkJkY28rdGuO2Rb09IXw07mu8ROwpovd45kz0lr0YvcvFbeC9yk3hYoF2JBKvSjPpfqrhWFMuVWTzUOpv3UK2BD2AHoH%2FxtOJHNNlyMIaBCMIYvtE9kTYKz%2BQXMaiSR0mJlkwNJJwQGonc%2Bfejw2taJpt%2B4yaC2WjYgW3c%2FtZDIkMvoaGijTtoQV76GOFO5pooe%2BqWXL21FNW3TxQwJcX5lh9y5iu%2FllKwsNuxQ6BYnIlU23kjwlnEj4PzyQLV74jqXTWbKDNP8bNWXNiv6RfS8iyXtH1fQYuMkiiJUb7nMmtKIi8%2By59jTS4zTYeY37uoAktXNattYKecSZYdSr1F8bV54k1M1Ht0AdRYniZtXW9Ex9NYbcfckhCOukBTx3Jao5%2FPU9w%2BiNSSj3rQrfMkHbzU8tkA9d9DAsythSV%2Bw9IguA%2BAHZazEbrDjvMQiuQQN6uwymuLfraE7l3BD0HwwVorR%2FAWZ4A%2BmuPtd49yq%2BU21bdgni%2BZ6bIMjuDViw1XmxwlLxzfztSYtDBM2Q0QvaLtFrDG8tlaPrBOcwdGOSQraP%2FdyOrr8%2BqyeBlbFcerM0HWfS5yJNmYOCbHMCYmcuJ26B8R%2F1%2FtBlAmhpMqfsjPcSnr6qR5DEuL6EM%2BDnPSPV%2FqcoD4k3B28m4DoMtWJ7ciQsvVizlEd1RZbbfZlg5TjNX%2FwDVEQv0Ex8b60lPJ7EoIa7i4NFpj3UB2mNDtfufGckyqctoqgSnHxB7PmAVMRyzR7a5Y5md7xncGvXMFRfP%2BR%2F7rPcMLmX7MsGOrEBCKnJwI1PnseraCq58v4tA8ODTsDy5LUiEwEP1p6fvZRxE8O69uBfeYk31kaWFvWkKzYyDU3UQoJmCVsjC7JizMB7BfXAsJDHeBNVsDACXzYnL6Q4r4Sfv3LHts4SzZqwCMU1xtL1vQVJ9nis56G83GMN3fnKZNkOStzdidVgIfESnzGz0aIrb%2FTflu1rxxQ3dziotSQChuVeS%2BSQO%2ByJjUM6%2FK5Rpl%2FrfImXpJ8hk6ZO&X-Amz-Signature=5c552793ca74c01415cb0dc43479b0bd07c88d5d71f01ee99cdfdc012090cea8&X-Amz-SignedHeaders=host",
                "documentId": 10726007
            }
        ],
        "invoiceUrls": [
            {
                "url": "https://visit-user-uploads-prod-mum.s3.ap-south-1.amazonaws.com/5970185/reimbursements/05ca8422c4edf4f63e4d9e5124b5b335.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA6MR3BLFQOQWAMQXG%2F20260129%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260129T075415Z&X-Amz-Expires=7200&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmFwLXNvdXRoLTEiRzBFAiEA0r5ukezub%2BzGAIOY0k2dkzKbxNmvkuHoXBp7fHougQgCIEFZ7tu7bUzXrBWAjAJwm0YqED7PgVCwlMGPJ%2FmAAk8MKsgFCIH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMOTg5MDQwMDQwMjg4Igzv9V0IrefjqwmXE3oqnAVGwlY3BzQdI%2FApb0%2BKz6uzWohr7Tt56NoHuFGoJR4a%2FrDqQYztXPZs9xft0EN59gMMCB8w9UeO5j7JhGBOQVWnl%2FFK2bHS2%2BHNI1%2BXBFDU7ZXLqu85%2FaGIinJNYyV%2BS4eLvXQoqGUaXnprHWttgaqHz1m27CqtHXWyv0ejVC7yBgI%2B6cORqoSMT2bwJIKosgIN1VbinxSxaHfO0Z3aUoyIuQ37MTHevnFv8oKptwUIJjJidAW6F5r3XlBSmYgT28vMVTWOLV5ao2JEGOYIPzoiak7qEKaheqz3mVTjEsZJ54icYxHu3p9C4o4bk67ZbWHu3k8UUFoffzZCh79qvDwxG%2BFLZ3GPC5qX%2B4ydQmlelYUAYpvwIDcm%2Fp6cvzq9BvYIsVo5xX3poxPupc2sKs59kRNhkv7qT5OAK2IpvHRb4xLO5uJLgOiyDc4VPs0VcDyyH3rseXiQiQB89eB2drO2JAC4nDAo5SA1ykY3u%2BAVWxniXda9R6PqBrQyv6r5JwvirrEYvCJ%2BsF%2Blr7V%2F5Ndbxh10rOZuA3xk3G7bYpkeUmJUdoK4PyR%2BZnEf1VM4fpr1RZVIo2jIr0ZXeWDhqaFGwGSr3lPQyg1rldV9M3geMW%2Fl14Q975IyYzheMPmUqGdmg9GUvWdSX2QrauK62tP345ZVow%2BNP%2B9kgVfim%2FiWtJvE1f%2B1JCP%2FIj%2BMGPgr01824R2zgajYUsyrm2M9WFCcANJ%2BHg7iL6w5QPLb2hh7aGUSOi1bfPwndh89b2rWkodYcUNzikQkH%2BUIo5U23M1KQte2xGLVE%2BLsC%2BT0AovniCaw6rbklMmLkHLwlOKw85W%2BPukJrN%2FxamJKuOej%2F49SaZsBJO3ZuJyjMYwzhVtDvhZHU%2Ft6pSKb222xezCGmezLBjqxAY7tF%2Bhuc5AtN7Ef15fIaD2NJDY1FhkVZq6d%2BX4eylDUTP584HnonD38axpRmlaFg69tSO48Qmqa45uFOvxlDmsbGZhpjSLjyVLYm0GiWX%2B502rhc9fkz4QelLxxdw7kwzJdTTydIGYRLnlugGT9lq2ctVc2VXykWPgRht2CGae2i8dO4k9rjmXqBF%2BqxobWnbbg32ZMEc0N%2BivxGybNwsiemmNqFZ1PmduMLDJWqOC8WQ%3D%3D&X-Amz-Signature=8e14aa01f4e8075791cef4403a0ac58f598d7750311fe25628c3ca3c6685d9fc&X-Amz-SignedHeaders=host",
                "documentId": 10726008
            }
        ],
        "supportDocumentsUrl": [], // lab_report
        "userRaisedAmount": "618.00",
        "requestDate": "15/12/2025", // usually when we get this . 
        "allPolicyMembers": {
            "holder": {
                "name": "Bikash Ranjan",
               
            },
            "dependents": [
                {
                    "name": "Rima Kumari",
                  
                   
                },
                {
                    "name": "Yashvi Kumari",
                   
                },
                {
                    "name": "Reet Kumari",
                    
                }
            ],
            "newPolicy": true
        },
        "policyDocuments": [
            {
                "policyId": 3845,
                "documentUrl": "https://visit-public-stage.s3.ap-south-1.amazonaws.com/sponsor-policies/Wipro%20Tech_WIPRO_Tech_policy.pdf"
            }
        ]
    }