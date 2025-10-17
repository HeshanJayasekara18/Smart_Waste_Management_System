import { Router } from 'express';
import { listAlerts } from '../controllers/NotificationController.js';

const router = Router();

router.get('/', listAlerts);

export default router;
