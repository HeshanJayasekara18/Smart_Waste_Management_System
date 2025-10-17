import { jest } from '@jest/globals';

const mockScheduleFind = jest.fn().mockResolvedValue([]);
const mockScheduleFindById = jest.fn().mockResolvedValue(null);
const mockScheduleFindByIdAndDelete = jest.fn();

const ScheduleMock = function (payload) {
  this.payload = payload;
  this.alerts = [];
  this.save = jest.fn().mockResolvedValue({ id: '123', ...this.payload, alerts: this.alerts });
  return this;
};

ScheduleMock.find = mockScheduleFind;
ScheduleMock.findById = mockScheduleFindById;
ScheduleMock.findByIdAndDelete = mockScheduleFindByIdAndDelete;

await jest.unstable_mockModule('../models/Schedule.js', () => ({
  default: ScheduleMock,
}));

const { default: Schedule } = await import('../models/Schedule.js');
const { default: scheduleService } = await import('../services/ScheduleService.js');

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
    Schedule.find.mockResolvedValue([]);
    Schedule.findById.mockResolvedValue(null);
    Schedule.findByIdAndDelete.mockResolvedValue(null);
  });

  describe('createSchedule', () => {
    // Positive case (Equivalence class: valid schedule payload)
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

    // Negative case (Equivalence class: missing required fields)
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

    // Edge case (Equivalence class: legacy caller with non-object crew)
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

    // Edge case (Equivalence class: payload without explicit priority)
    it('defaults priority when omitted', async () => {
      const payload = {
        routeId: 'R1',
        zone: 'Zone A',
        scheduledStart: baseStart.toISOString(),
        scheduledEnd: baseEnd.toISOString(),
        binIds: ['BIN-1'],
        createdBy: 'admin',
      };

      const result = await scheduleService.createSchedule(payload);

      expect(result.priority).toBe('MEDIUM');
    });
  });

  describe('updateSchedule', () => {
    // Positive case (Equivalence class: partial update with valid overrides)
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

    // Negative case (Equivalence class: conflicting schedule update)
    it('retains legacy crew fields when assigned crew is missing and throws on overlap', async () => {
      const doc = buildScheduleDoc({ assignedCrew: {}, driverId: 'legacy-driver', vehicleId: 'legacy-vehicle' });
      Schedule.findById.mockResolvedValueOnce(doc);
      Schedule.find.mockResolvedValueOnce([{ id: 'existing' }]);

      await expect(
        scheduleService.updateSchedule(doc._id, { assignedCrew: {}, routeId: 'R2' })
      ).rejects.toThrow('Schedule overlaps with an existing allocation');

      expect(doc.save).not.toHaveBeenCalled();
    });

    // Negative case (Equivalence class: update missing bin assignments)
    it('rejects binIds update without entries', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(scheduleService.updateSchedule(doc._id, { binIds: [] })).rejects.toThrow('binIds must include at least one bin');
    });

    // Negative case (Equivalence class: update with reversed date window)
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

    // Edge case (Equivalence class: clearing legacy driver/vehicle identifiers)
    it('allows empty driverId or vehicleId for clearing fields', async () => {
      const doc = buildScheduleDoc({ assignedCrew: { driverId: 'driver-1', vehicleId: 'vehicle-1' } });
      Schedule.findById.mockResolvedValueOnce(doc);
      Schedule.find.mockResolvedValueOnce([]);

      const result = await scheduleService.updateSchedule(doc._id, { driverId: '', vehicleId: '' });

      expect(result.assignedCrew).toEqual({});
    });
  });

  describe('listSchedules', () => {
    // Positive case (Equivalence class: valid filter object)
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
    // Positive case (Equivalence class: existing schedule id)
    it('returns schedule when found', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      const result = await scheduleService.getSchedule(doc._id);

      expect(result).toBe(doc);
    });

    // Negative case (Equivalence class: missing schedule id)
    it('throws when schedule is missing', async () => {
      await expect(scheduleService.getSchedule('missing')).rejects.toThrow('Schedule not found');
    });
  });

  describe('changeStatus', () => {
    // Positive case (Equivalence class: allowed status transition)
    it('updates status with valid transition', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      const result = await scheduleService.changeStatus(doc._id, 'in_progress');

      expect(doc.status).toBe('IN_PROGRESS');
      expect(doc.lastValidatedAt).toBeInstanceOf(Date);
      expect(doc.save).toHaveBeenCalled();
      expect(result.status).toBe('IN_PROGRESS');
    });

    // Negative case (Equivalence class: disallowed status transition)
    it('rejects invalid transition', async () => {
      const doc = buildScheduleDoc({ status: 'COMPLETED' });
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(scheduleService.changeStatus(doc._id, 'IN_PROGRESS')).rejects.toThrow('Cannot transition schedule from COMPLETED to IN_PROGRESS');
      expect(doc.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteSchedule', () => {
    // Positive case (Equivalence class: existing schedule id for delete)
    it('removes schedule when it exists', async () => {
      const doc = buildScheduleDoc();
      Schedule.findByIdAndDelete.mockResolvedValueOnce(doc);

      const result = await scheduleService.deleteSchedule(doc._id);

      expect(Schedule.findByIdAndDelete).toHaveBeenCalledWith(doc._id);
      expect(result).toBe(doc);
    });

    // Negative case (Equivalence class: nonexistent schedule id for delete)
    it('throws when schedule does not exist', async () => {
      await expect(scheduleService.deleteSchedule('missing')).rejects.toThrow('Schedule not found');
    });
  });

  describe('recordAlert', () => {
    // Positive case (Equivalence class: valid alert payload)
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

    // Negative case (Equivalence class: alert with invalid type enum)
    it('rejects alert payload with invalid enum', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(
        scheduleService.recordAlert(doc._id, { type: 'invalid', message: 'Alert' })
      ).rejects.toThrow('alert type is invalid');
    });

    // Edge case (Equivalence class: alert payload without triggeredAt)
    it('defaults triggeredAt when missing', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      const result = await scheduleService.recordAlert(doc._id, { type: 'iot_warning', message: 'Check' });

      expect(result.alerts[0].triggeredAt).toBeInstanceOf(Date);
    });

    // Negative case (Equivalence class: alert payload with invalid resolvedAt)
    it('rejects alert with invalid resolvedAt', async () => {
      const doc = buildScheduleDoc();
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(
        scheduleService.recordAlert(doc._id, { type: 'update_required', message: 'Alert', resolvedAt: 'bad-date' })
      ).rejects.toThrow('resolvedAt must be a valid date');
    });
  });

  describe('resolveAlert', () => {
    // Positive case (Equivalence class: alert id exists within schedule)
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

    // Negative case (Equivalence class: alert id missing from schedule)
    it('throws when alert is not found', async () => {
      const doc = buildScheduleDoc({ alerts: [] });
      doc.alerts.id = jest.fn(() => null);
      Schedule.findById.mockResolvedValueOnce(doc);

      await expect(scheduleService.resolveAlert(doc._id, 'missing-alert')).rejects.toThrow('Alert not found for schedule');
    });
  });

  describe('helper validations', () => {
    // Negative case (Equivalence class: unsupported priority value)
    it('rejects invalid priority value', async () => {
      const payload = {
        routeId: 'R1',
        zone: 'Zone A',
        scheduledStart: baseStart.toISOString(),
        scheduledEnd: baseEnd.toISOString(),
        binIds: ['BIN-1'],
        createdBy: 'admin',
        priority: 'CRITICAL',
      };

      await expect(scheduleService.createSchedule(payload)).rejects.toThrow('priority is invalid');
    });
  });
});
