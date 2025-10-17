const express = require('express');
const {
  createSchedule,
  listSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  changeScheduleStatus,
  recordScheduleAlert,
  resolveScheduleAlert,
} = require('../controllers/ScheduleController');

const router = express.Router();

router.post('/', createSchedule);
router.get('/', listSchedules);
router.get('/:id', getSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);
router.patch('/:id/status', changeScheduleStatus);
router.post('/:id/alerts', recordScheduleAlert);
router.patch('/:id/alerts/:alertId/resolve', resolveScheduleAlert);

module.exports = router;
