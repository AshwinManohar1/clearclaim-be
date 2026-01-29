import { Router } from 'express';
import { claimController } from '../controllers/claimController';

const router = Router();

router.post('/', (req, res, next) => claimController.createClaim(req, res, next));
router.get('/', (req, res, next) => claimController.getAllClaims(req, res, next));
router.get('/:id', (req, res, next) => claimController.getClaimById(req, res, next));
router.post('/:id/submit', (req, res, next) => claimController.submitClaim(req, res, next));

export default router;
