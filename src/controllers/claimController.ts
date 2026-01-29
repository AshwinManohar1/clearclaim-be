import { Request, Response, NextFunction } from 'express';
import { claimService } from '../services/claimService';
import { ClaimInput } from '../types';
import { getPolicyData } from '../data/policies';

export class ClaimController {
  async createClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientDetails,
        prescriptionsUrls,
        invoiceUrls,
        supportDocumentsUrl,
        userRaisedAmount,
        requestDate,
        policyDocuments,
      } = req.body as ClaimInput;

      // Validate required fields
      if (!patientDetails?.name) {
        res.status(400).json({
          success: false,
          message: 'patientDetails.name is required',
        });
        return;
      }

      if (!prescriptionsUrls || !Array.isArray(prescriptionsUrls) || prescriptionsUrls.length === 0) {
        res.status(400).json({
          success: false,
          message: 'prescriptionsUrls (non-empty array) is required',
        });
        return;
      }

      if (!invoiceUrls || !Array.isArray(invoiceUrls) || invoiceUrls.length === 0) {
        res.status(400).json({
          success: false,
          message: 'invoiceUrls (non-empty array) is required',
        });
        return;
      }

      if (!policyDocuments || !Array.isArray(policyDocuments) || policyDocuments.length === 0) {
        res.status(400).json({
          success: false,
          message: 'policyDocuments (non-empty array) is required',
        });
        return;
      }

      // Validate policy name
      const policyName = policyDocuments[0]?.policyName;
      if (!policyName) {
        res.status(400).json({
          success: false,
          message: 'policyDocuments[0].policyName is required',
        });
        return;
      }

      const policy = getPolicyData(policyName);
      if (!policy) {
        res.status(400).json({
          success: false,
          message: `Invalid policy name: ${policyName}. Must be "Niva Bupa" or "Aditya Birla Health Insurance"`,
        });
        return;
      }

      if (!userRaisedAmount) {
        res.status(400).json({
          success: false,
          message: 'userRaisedAmount is required',
        });
        return;
      }

      if (!requestDate) {
        res.status(400).json({
          success: false,
          message: 'requestDate is required',
        });
        return;
      }

      const claimInput: ClaimInput = {
        patientDetails,
        prescriptionsUrls,
        invoiceUrls,
        supportDocumentsUrl: supportDocumentsUrl || [],
        userRaisedAmount,
        requestDate,
        policyDocuments,
      };

      const claim = await claimService.createClaim(claimInput);

      res.status(201).json({
        success: true,
        data: claim,
        message: 'Claim created successfully',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await claimService.getAllClaims(page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getClaimById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const claim = await claimService.getClaimById(id);

      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: claim,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async submitClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const claim = await claimService.submitClaim(id);

      if (!claim) {
        res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: claim,
        message: 'Claim submitted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('must be in')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }
}

export const claimController = new ClaimController();
