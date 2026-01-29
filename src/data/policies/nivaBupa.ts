import { PolicyData } from '../../types';

export const nivaBupaPolicy: PolicyData = {
  policy_basic_info: {
    policy_number: "",
    policy_type: "",
    policyholder_name: "",
    insurer_name: "Niva Bupa",
    policy_start_date: "2025-08-01",
    policy_end_date: "2026-07-31",
    sum_insured: 25000
  },
  policy_coverage: {
    covered_benefits: [
      "Teleconsultations (General Physician, Specialist, Super Specialist)",
      "Doctor consultations (General Physician, Specialist, Super Specialist - Allopathic)",
      "Prescribed diagnostics (Pathology & Radiology)",
      "Dental - except Cosmetic",
      "Vision including Prescription lens and Frames cover",
      "Prescribed pharmacy (Allopathic only)",
      "WHO Prescribed Vaccines",
      "Prescribed Physiotherapy",
      "Annual Health Check"
    ],
    coverage_limits: [
      {
        benefit_name: "Teleconsultations (General Physician, Specialist, Super Specialist)",
        limit_amount: 0,
        limit_type: "Unlimited on Visit App",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Doctor consultations (General Physician, Specialist, Super Specialist - Allopathic)",
        limit_amount: 20000,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Prescribed diagnostics (Pathology & Radiology)",
        limit_amount: 20000,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Dental - except Cosmetic",
        limit_amount: 15000,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Vision including Prescription lens and Frames cover",
        limit_amount: 15000,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Prescribed pharmacy (Allopathic only)",
        limit_amount: 7500,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "WHO Prescribed Vaccines",
        limit_amount: 15000,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Prescribed Physiotherapy",
        limit_amount: 15000,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Annual Health Check",
        limit_amount: 5000,
        limit_type: "per year",
        is_sub_limit: false,
        parent_benefit: null
      }
    ]
  },
  policy_exclusions: {
    excluded_conditions: [
      "Food supplements or dietary pills (e.g., Horlicks, Glucose, Whey Protein, etc.)",
      "Dietary supplements and substances that can be purchased without prescription unless prescribed by a medical practitioner as part of treatment",
      "All non-medical expenses or standard deductions incurred during inpatient hospitalization or day-care treatments",
      "Any ailment with sublimit in Group medical plan coverage cannot be claimed under OPD Policy",
      "Procedure fees or any type of procedure fees paid during an OP consultation (e.g., wound cleaning, dressing)",
      "Over-the-counter (OTC) medicines purchased without a doctor's prescription",
      "Diagnostics investigations done without a doctor's prescription"
    ],
    waiting_periods: []
  },
  policy_terms: {
    deductible: 0,
    co_payment: 0,
    premium_amount: 0,
    premium_frequency: ""
  },
  policy_synopsis: {
    key_points: [],
    important_notes: []
  }
};
