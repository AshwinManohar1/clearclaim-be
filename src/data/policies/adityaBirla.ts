import { PolicyData } from '../../types';

export const adityaBirlaPolicy: PolicyData = {
  policy_basic_info: {
    policy_number: "",
    policy_type: "Health Insurance",
    policyholder_name: "",
    insurer_name: "Aditya Birla Health Insurance",
    policy_start_date: "2025-04-02",
    policy_end_date: "",
    sum_insured: 15000
  },
  policy_coverage: {
    covered_benefits: [
      "GP/Specialist Consultation",
      "Prescribed Diagnostics",
      "Dental Procedure",
      "Vision Procedure",
      "Prescribed Pharmacy",
      "COVID Vaccination",
      "Teleconsultation"
    ],
    coverage_limits: [
      {
        benefit_name: "GP/Specialist Consultation",
        limit_amount: 15000,
        limit_type: "Up to the Wallet Limit",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Prescribed Diagnostics",
        limit_amount: 15000,
        limit_type: "Up to the Wallet Limit",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Dental Procedure",
        limit_amount: 15000,
        limit_type: "Up to the Wallet Limit",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Vision Procedure",
        limit_amount: 15000,
        limit_type: "Up to the Wallet Limit",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Prescribed Pharmacy",
        limit_amount: 15000,
        limit_type: "Up to the Wallet Limit",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "COVID Vaccination",
        limit_amount: 15000,
        limit_type: "Up to the Wallet Limit",
        is_sub_limit: false,
        parent_benefit: null
      },
      {
        benefit_name: "Teleconsultation",
        limit_amount: 15000,
        limit_type: "Up to the Wallet Limit",
        is_sub_limit: false,
        parent_benefit: null
      }
    ]
  },
  policy_exclusions: {
    excluded_conditions: [
      "Food, Food Supplements or Dietary Pills (e.g., Horlicks, Glucose, Whey Protein, etc.)",
      "Dietary supplements and substances, including but not limited to Vitamins, minerals and organic substances not covered unless prescribed by a medical practitioner as part of treatment",
      "All non-medical expenses or standard deductions incurred during inpatient hospitalization or day-care treatments",
      "Any ailment with sublimit in Group medical plan coverage cannot be claimed under OPD Policy",
      "Mental health/Development disorders not covered (unless called out in inclusion list)",
      "Procedure fee or any type of procedure fees paid during an OP consultation"
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
    key_points: [
      "OPD benefits can be availed in a cashless manner through the Visit App",
      "Reimbursement claims can also be submitted on the Visit App",
      "The teleconsultation benefit is available on a cashless basis only",
      "Family Definition is (1+5): Employee + Spouse + 2 Children + Parents + Parents In law",
      "Cross Selection of Parents/PIL is allowed",
      "LGBT or Domestic or Live in Partner allowed",
      "Wallet is shared between the employee and the dependents"
    ],
    important_notes: []
  }
};
