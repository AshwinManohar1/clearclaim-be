import mongoose, { Schema, Document } from 'mongoose';
import { ClaimStatus, IClaim, AdjudicationResult, MedicineMatch, LabTestMatch, OthersMatch } from '../types';

export interface IClaimDocument extends Omit<IClaim, '_id'>, Document {}

const AdjudicationResultSchema = new Schema<AdjudicationResult>({
  approved: { type: Boolean, required: true },
  rejectionReasons: {
    type: [{
      value: String,
      title: String,
      reasoning: String
    }],
    default: []
  },
  notes: { type: String },
  totalClaimedAmount: { type: Number },
  totalReimbursableAmount: { type: Number },
  aiExplanation: { type: String },
  processedAt: { type: Date, default: Date.now },
  matchingResults: {
    medicines: { type: [Schema.Types.Mixed], default: [] },
    labTests: { type: [Schema.Types.Mixed], default: [] },
    others: { type: [Schema.Types.Mixed], default: [] }
  },
  policyValidation: { type: Schema.Types.Mixed }
}, { _id: false });

const ClaimSchema = new Schema<IClaimDocument>(
  {
    patientDetails: {
      type: {
        name: { type: String, required: true, trim: true }
      },
      required: true
    },
    prescriptionsUrls: {
      type: [{
        url: { type: String, required: true },
        documentId: { type: Schema.Types.Mixed, required: false }
      }],
      required: true,
      validate: {
        validator: (urls: any[]) => urls.length > 0,
        message: 'At least one prescription URL is required',
      },
    },
    invoiceUrls: {
      type: [{
        url: { type: String, required: true },
        documentId: { type: Schema.Types.Mixed, required: false }
      }],
      required: true,
      validate: {
        validator: (urls: any[]) => urls.length > 0,
        message: 'At least one invoice URL is required',
      },
    },
    supportDocumentsUrl: {
      type: [{
        url: { type: String, required: true },
        documentId: { type: Schema.Types.Mixed, required: false }
      }],
      default: []
    },
    userRaisedAmount: {
      type: String,
      required: true
    },
    requestDate: {
      type: String,
      required: true
    },
    policyDocuments: {
      type: [{
        policyName: { type: String, required: true }
      }],
      required: true,
      validate: {
        validator: (policies: any[]) => policies.length > 0,
        message: 'At least one policy document is required',
      },
    },
    status: {
      type: String,
      enum: Object.values(ClaimStatus),
      default: ClaimStatus.PENDING,
      required: true,
    },
    prescriptionData: {
      type: Schema.Types.Mixed
    },
    invoiceData: {
      type: Schema.Types.Mixed
    },
    labReportData: {
      type: Schema.Types.Mixed
    },
    policyName: {
      type: String
    },
    medicineMatches: {
      type: [Schema.Types.Mixed],
      default: []
    },
    labTestMatches: {
      type: [Schema.Types.Mixed],
      default: []
    },
    othersMatches: {
      type: [Schema.Types.Mixed],
      default: []
    },
    adjudicationResult: {
      type: AdjudicationResultSchema,
    },
  },
  {
    timestamps: true,
  }
);

export const Claim = mongoose.model<IClaimDocument>('Claim', ClaimSchema);
