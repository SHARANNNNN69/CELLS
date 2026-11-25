import express from 'express';
import { getBloodBanks, getBloodBankById } from '../controllers/bloodBankController.js';

const router = express.Router();

router.get('/', getBloodBanks);
router.get('/:id', getBloodBankById);

export default router;
