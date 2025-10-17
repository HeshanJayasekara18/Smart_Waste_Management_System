import Schedule from '../models/Schedule.js';

describe('Schedule model validation', () => {
  // Negative case: rejects schedules with empty bin identifiers.
  it('rejects invalid bin identifiers', async () => {
    const schedule = new Schedule({
      routeId: 'R1',
      zone: 'Zone A',
      binIds: ['VALID', ''],
      scheduledStart: new Date('2025-01-01T09:00:00.000Z'),
      scheduledEnd: new Date('2025-01-01T10:00:00.000Z'),
      createdBy: 'tester',
    });

    await expect(schedule.validate()).rejects.toThrow('Bin identifiers must be non-empty strings');
  });

  // Negative case: pre-validate hook ensures start precedes end time.
  it('rejects start time not before end time', async () => {
    const schedule = new Schedule({
      routeId: 'R1',
      zone: 'Zone A',
      binIds: ['BIN-1'],
      scheduledStart: new Date('2025-01-01T11:00:00.000Z'),
      scheduledEnd: new Date('2025-01-01T10:00:00.000Z'),
      createdBy: 'tester',
    });

    await expect(schedule.validate()).rejects.toThrow('Schedule start time must be before end time');
  });
});
