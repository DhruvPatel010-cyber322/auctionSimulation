import express from 'express';
import { createProposal, getProposals, updateProposalStatus } from '../controllers/tradeController.js';
import { toggleTrading } from '../controllers/auctionController.js';

const router = express.Router();

router.post('/proposal', createProposal);
router.get('/proposals/:teamId', getProposals);
router.put('/proposal/:proposalId', updateProposalStatus);

// Admin route
router.post('/toggle', toggleTrading);

export default router;
