const scheduleService = require('../services/ScheduleService');
const controller = require('../controllers/ScheduleController');

jest.mock('../services/ScheduleService');

describe('ScheduleController', () => {
  const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSchedule', () => {
    it('returns 201 with created schedule', async () => {
      const req = { body: { routeId: 'R1' } };
      scheduleService.createSchedule.mockResolvedValueOnce({ id: 'created' });
      const res = buildRes();

      await controller.createSchedule(req, res, next);

      expect(scheduleService.createSchedule).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 'created' });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors', async () => {
      const req = { body: {} };
      const error = new Error('fail');
      scheduleService.createSchedule.mockRejectedValueOnce(error);
      const res = buildRes();

      await controller.createSchedule(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('listSchedules', () => {
    it('extracts query filters and returns schedules', async () => {
      const req = { query: { status: 'PLANNED', extra: 'ignored' } };
      const res = buildRes();
      const schedules = [{ id: 's1' }];
      scheduleService.listSchedules.mockResolvedValueOnce(schedules);

      await controller.listSchedules(req, res, next);

      expect(scheduleService.listSchedules).toHaveBeenCalledWith({ status: 'PLANNED' });
      expect(res.json).toHaveBeenCalledWith(schedules);
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors when listing fails', async () => {
      const req = { query: {} };
      const res = buildRes();
      const error = new Error('cannot list');
      scheduleService.listSchedules.mockRejectedValueOnce(error);

      await controller.listSchedules(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getSchedule', () => {
    it('returns schedule by id', async () => {
      const req = { params: { id: '123' } };
      const res = buildRes();
      scheduleService.getSchedule.mockResolvedValueOnce({ id: '123' });

      await controller.getSchedule(req, res, next);

      expect(scheduleService.getSchedule).toHaveBeenCalledWith('123');
      expect(res.json).toHaveBeenCalledWith({ id: '123' });
    });

    it('forwards errors when get fails', async () => {
      const req = { params: { id: 'missing' } };
      const res = buildRes();
      const error = new Error('not found');
      scheduleService.getSchedule.mockRejectedValueOnce(error);

      await controller.getSchedule(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateSchedule', () => {
    it('returns updated schedule', async () => {
      const req = { params: { id: '123' }, body: { notes: 'updated' } };
      const res = buildRes();
      scheduleService.updateSchedule.mockResolvedValueOnce({ id: '123', notes: 'updated' });

      await controller.updateSchedule(req, res, next);

      expect(scheduleService.updateSchedule).toHaveBeenCalledWith('123', req.body);
      expect(res.json).toHaveBeenCalledWith({ id: '123', notes: 'updated' });
    });

    it('forwards errors when update fails', async () => {
      const req = { params: { id: '123' }, body: {} };
      const res = buildRes();
      const error = new Error('update error');
      scheduleService.updateSchedule.mockRejectedValueOnce(error);

      await controller.updateSchedule(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteSchedule', () => {
    it('responds with 204 on success', async () => {
      const req = { params: { id: '123' } };
      const res = buildRes();
      scheduleService.deleteSchedule.mockResolvedValueOnce();

      await controller.deleteSchedule(req, res, next);

      expect(scheduleService.deleteSchedule).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
    });

    it('forwards errors when delete fails', async () => {
      const req = { params: { id: '123' } };
      const res = buildRes();
      const error = new Error('delete fail');
      scheduleService.deleteSchedule.mockRejectedValueOnce(error);

      await controller.deleteSchedule(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('changeScheduleStatus', () => {
    it('returns updated schedule with new status', async () => {
      const req = { params: { id: '123' }, body: { status: 'IN_PROGRESS' } };
      const res = buildRes();
      scheduleService.changeStatus.mockResolvedValueOnce({ id: '123', status: 'IN_PROGRESS' });

      await controller.changeScheduleStatus(req, res, next);

      expect(scheduleService.changeStatus).toHaveBeenCalledWith('123', 'IN_PROGRESS');
      expect(res.json).toHaveBeenCalledWith({ id: '123', status: 'IN_PROGRESS' });
    });

    it('forwards errors when status change fails', async () => {
      const req = { params: { id: '123' }, body: { status: 'IN_PROGRESS' } };
      const res = buildRes();
      const error = new Error('status fail');
      scheduleService.changeStatus.mockRejectedValueOnce(error);

      await controller.changeScheduleStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('recordScheduleAlert', () => {
    it('returns 201 with updated schedule', async () => {
      const req = { params: { id: '123' }, body: { message: 'alert' } };
      const res = buildRes();
      scheduleService.recordAlert.mockResolvedValueOnce({ id: '123', alerts: [] });

      await controller.recordScheduleAlert(req, res, next);

      expect(scheduleService.recordAlert).toHaveBeenCalledWith('123', req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: '123', alerts: [] });
    });

    it('forwards errors when alert record fails', async () => {
      const req = { params: { id: '123' }, body: { message: 'alert' } };
      const res = buildRes();
      const error = new Error('record fail');
      scheduleService.recordAlert.mockRejectedValueOnce(error);

      await controller.recordScheduleAlert(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('resolveScheduleAlert', () => {
    it('returns schedule with resolved alert', async () => {
      const req = { params: { id: '123', alertId: 'a1' } };
      const res = buildRes();
      scheduleService.resolveAlert.mockResolvedValueOnce({ id: '123', alerts: [] });

      await controller.resolveScheduleAlert(req, res, next);

      expect(scheduleService.resolveAlert).toHaveBeenCalledWith('123', 'a1');
      expect(res.json).toHaveBeenCalledWith({ id: '123', alerts: [] });
    });

    it('forwards errors when alert resolve fails', async () => {
      const req = { params: { id: '123', alertId: 'a1' } };
      const res = buildRes();
      const error = new Error('resolve fail');
      scheduleService.resolveAlert.mockRejectedValueOnce(error);

      await controller.resolveScheduleAlert(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
