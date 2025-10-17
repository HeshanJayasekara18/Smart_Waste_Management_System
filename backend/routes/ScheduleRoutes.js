import { Router } from 'express';
import {
  createSchedule,
  listSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  changeScheduleStatus,
  recordScheduleAlert,
  resolveScheduleAlert,
} from '../controllers/ScheduleController.js';

const router = Router();

router.post('/', createSchedule);
router.get('/', listSchedules);
router.get('/:id', getSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);
router.patch('/:id/status', changeScheduleStatus);
router.post('/:id/alerts', recordScheduleAlert);
router.patch('/:id/alerts/:alertId/resolve', resolveScheduleAlert);

export default router;
