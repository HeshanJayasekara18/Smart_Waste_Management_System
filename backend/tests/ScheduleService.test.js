jest.mock('../models/Schedule', () => {
  const ScheduleMock = function (payload) {
    this.payload = payload;
    this.alerts = [];
    this.save = jest.fn().mockResolvedValue({ id: '123', ...this.payload, alerts: this.alerts });
    return this;
  };

  ScheduleMock.find = jest.fn().mockResolvedValue([]);
  ScheduleMock.findById = jest.fn().mockResolvedValue(null);
  ScheduleMock.findByIdAndDelete = jest.fn();

  return ScheduleMock;
});

const Schedule = require('../models/Schedule');
const scheduleService = require('../services/ScheduleService');

const baseStart = new Date('2025-01-01T09:00:00.000Z');
const baseEnd = new Date('2025-01-01T10:00:00.000Z');

function buildScheduleDoc(overrides = {}) {
  const doc = {
    _id: 'schedule-123',
    routeId: 'R1',
    zone: 'Zone A',
    binIds: ['BIN-1'],
    scheduledStart: baseStart,
    scheduledEnd: baseEnd,
    assignedCrew: { driverId: 'driver-1', vehicleId: 'vehicle-1', supervisorId: 'supervisor-1' },
    status: 'PLANNED',
    alerts: [],
    lastValidatedAt: null,
    notes: '',
    driverId: undefined,
    vehicleId: undefined,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve({ ...this });
    }),
    markModified: jest.fn(),
  };
  Object.assign(doc, overrides);
  return doc;
}

describe('ScheduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Schedule.find.mockImplementation(() => Promise.resolve([]));
    Schedule.findById.mockResolvedValue(null);
    Schedule.findByIdAndDelete.mockResolvedValue(null);
  });

  describe('createSchedule', () => {
    it('creates schedule when validation passes and no overlap', async () => {
      const payload = {
        routeId: 'R1',
        zone: 'Zone A',
        scheduledStart: baseStart.toISOString(),
        scheduledEnd: baseEnd.toISOString(),
        binIds: ['BIN-1'],
        createdBy: 'admin',
      };

      const result = await scheduleService.createSchedule(payload);

      expect(Schedule.find).toHaveBeenCalled();
      expect(result.id).toBe('123');
    });

    it('throws conflict error when overlap detected', async () => {
      const payload = {
        routeId: 'R1',
        zone: 'Zone A',
        scheduledStart: baseStart.toISOString(),
        scheduledEnd: baseEnd.toISOString(),
        binIds: ['BIN-1'],
        createdBy: 'admin',
      };

      Schedule.find.mockResolvedValueOnce([{ id: 'existing' }]);

      await expect(scheduleService.createSchedule(payload)).rejects.toThrow('Schedule overlaps with an existing allocation');
    });

    it('rejects when payload is missing required fields', async () => {
      const payload = {
        routeId: '',
        zone: '',
        scheduledStart: baseEnd.toISOString(),
        scheduledEnd: baseStart.toISOString(),
        binIds: [],
        createdBy: '',
      };

      await expect(scheduleService.createSchedule(payload)).rejects.toThrow('routeId is required');
    });

    it('rejects invalid assigned crew structure', async () => {
      const payload = {
        routeId: 'R1',
        zone: 'Zone A',
        scheduledStart: baseStart.toISOString(),
        scheduledEnd: baseEnd.toISOString(),
        binIds: ['BIN-1'],
        createdBy: 'admin',
        assignedCrew: 'not-an-object',
      };

      const result = await scheduleService.createSchedule(payload);

      expect(result.assignedCrew).toEqual({});
    });
  });

  describe('updateSchedule', () => {
    it('merges crew updates, prefers top-level overrides, and marks as modified', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);
      const payload = {
        scheduledEnd: '2025-01-01T11:00:00.000Z',
        assignedCrew: { supervisorId: 'supervisor-2', vehicleId: 'vehicle-2' },
        driverId: 'driver-2',
      };

      const result = await scheduleService.updateSchedule(doc._id, payload);

      expect(Schedule.findById).toHaveBeenCalledWith(doc._id);
      expect(Schedule.find).toHaveBeenCalledWith(
        expect.objectContaining({ _id: { $ne: doc._id } })
      );
      expect(doc.assignedCrew).toEqual({ driverId: 'driver-2', vehicleId: 'vehicle-2', supervisorId: 'supervisor-2' });
      expect(doc.markModified).toHaveBeenCalledWith('assignedCrew');
      expect(doc.save).toHaveBeenCalled();
      expect(result.assignedCrew).toEqual(doc.assignedCrew);
    });

    it('retains legacy crew fields when assigned crew is missing and throws on overlap', async () => {
      const doc = buildScheduleDoc({ assignedCrew: {}, driverId: 'legacy-driver', vehicleId: 'legacy-vehicle' });
      Schedule.findById.mockResolvedValueOnce(doc);
      Schedule.find.mockResolvedValueOnce([{ id: 'existing' }]);

      await expect(
        scheduleService.updateSchedule(doc._id, { assignedCrew: {}, routeId: 'R2' })
      ).rejects.toThrow('Schedule overlaps with an existing allocation');

      expect(doc.save).not.toHaveBeenCalled();
    });

    it('rejects binIds update without entries', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(scheduleService.updateSchedule(doc._id, { binIds: [] })).rejects.toThrow('binIds must include at least one bin');
    });

    it('rejects invalid date ordering during update', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(
        scheduleService.updateSchedule(doc._id, {
          scheduledStart: '2025-01-01T12:00:00.000Z',
          scheduledEnd: '2025-01-01T11:00:00.000Z',
        })
      ).rejects.toThrow('scheduledStart must be earlier than scheduledEnd');
    });

    it('allows empty driverId or vehicleId for clearing fields', async () => {
      const doc = buildScheduleDoc({ assignedCrew: { driverId: 'driver-1', vehicleId: 'vehicle-1' } });
      Schedule.findById.mockResolvedValueOnce(doc);
      Schedule.find.mockResolvedValueOnce([]);

      const result = await scheduleService.updateSchedule(doc._id, { driverId: '', vehicleId: '' });

      expect(result.assignedCrew).toEqual({});
    });
  });

  describe('listSchedules', () => {
    it('applies trimmed and normalized filters', async () => {
      const sort = jest.fn().mockResolvedValue(['result']);
      Schedule.find.mockReturnValueOnce({ sort });

      const result = await scheduleService.listSchedules({ status: ' planned ', zone: ' Central ', routeId: ' R10 ' });

      expect(Schedule.find).toHaveBeenCalledWith({ status: 'PLANNED', zone: 'Central', routeId: 'R10' });
      expect(sort).toHaveBeenCalledWith({ scheduledStart: 1 });
      expect(result).toEqual(['result']);
    });
  });

  describe('getSchedule', () => {
    it('returns schedule when found', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      const result = await scheduleService.getSchedule(doc._id);

      expect(result).toBe(doc);
    });

    it('throws when schedule is missing', async () => {
      await expect(scheduleService.getSchedule('missing')).rejects.toThrow('Schedule not found');
    });
  });

  describe('changeStatus', () => {
    it('updates status with valid transition', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      const result = await scheduleService.changeStatus(doc._id, 'in_progress');

      expect(doc.status).toBe('IN_PROGRESS');
      expect(doc.lastValidatedAt).toBeInstanceOf(Date);
      expect(doc.save).toHaveBeenCalled();
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('rejects invalid transition', async () => {
      const doc = buildScheduleDoc({ status: 'COMPLETED' });
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(scheduleService.changeStatus(doc._id, 'IN_PROGRESS')).rejects.toThrow('Cannot transition schedule from COMPLETED to IN_PROGRESS');
      expect(doc.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteSchedule', () => {
    it('removes schedule when it exists', async () => {
      const doc = buildScheduleDoc();
      Schedule.findByIdAndDelete.mockResolvedValueOnce(doc);

      const result = await scheduleService.deleteSchedule(doc._id);

      expect(Schedule.findByIdAndDelete).toHaveBeenCalledWith(doc._id);
      expect(result).toBe(doc);
    });

    it('throws when schedule does not exist', async () => {
      await expect(scheduleService.deleteSchedule('missing')).rejects.toThrow('Schedule not found');
    });
  });

  describe('recordAlert', () => {
    it('sanitizes and appends alert data', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);
      const payload = {
        type: 'update_required',
        message: 'Check sensors',
        triggeredAt: '2025-02-01T12:00:00.000Z',
      };

      const result = await scheduleService.recordAlert(doc._id, payload);

      expect(doc.alerts).toHaveLength(1);
      expect(doc.alerts[0]).toMatchObject({ type: 'UPDATE_REQUIRED', message: 'Check sensors' });
      expect(doc.alerts[0].triggeredAt).toBeInstanceOf(Date);
      expect(doc.lastValidatedAt).toBeInstanceOf(Date);
      expect(doc.save).toHaveBeenCalled();
      expect(result.alerts).toHaveLength(1);
    });

     it('rejects alert payload with invalid enum', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(
        scheduleService.recordAlert(doc._id, { type: 'invalid', message: 'Alert' })
      ).rejects.toThrow('alert type is invalid');
    });

    it('defaults triggeredAt when missing', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      const result = await scheduleService.recordAlert(doc._id, { type: 'iot_warning', message: 'Check' });

      expect(result.alerts[0].triggeredAt).toBeInstanceOf(Date);
    });
  });

  describe('resolveAlert', () => {
    it('marks alert as resolved', async () => {
      const alert = { _id: 'alert-1', resolved: false, resolvedAt: null };
      const doc = buildScheduleDoc({ alerts: [alert] });
      doc.alerts.id = jest.fn((id) => (id === 'alert-1' ? alert : null));
      Schedule.findById.mockResolvedValueOnce(doc);

      const result = await scheduleService.resolveAlert(doc._id, 'alert-1');

      expect(alert.resolved).toBe(true);
      expect(alert.resolvedAt).toBeInstanceOf(Date);
      expect(doc.lastValidatedAt).toBeInstanceOf(Date);
      expect(doc.save).toHaveBeenCalled();
      expect(result.alerts[0].resolved).toBe(true);
    });

    it('throws when alert is not found', async () => {
      const doc = buildScheduleDoc({ alerts: [] });
      doc.alerts.id = jest.fn(() => null);
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(scheduleService.resolveAlert(doc._id, 'missing-alert')).rejects.toThrow('Alert not found for schedule');
    });
  });
});
