import { Router } from 'express';
import { generateBill, getBill } from '../controllers/BillController.js';

const router = Router();

router.post('/generate', generateBill);
router.get('/:id', getBill);

export default router;
