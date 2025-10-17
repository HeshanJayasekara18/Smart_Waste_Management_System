const dummyAlerts = [
  {
    id: 'alert-001',
    routeCode: 'R1',
    type: 'IOT_WARNING',
    severity: 'HIGH',
    message: 'Sensor detected overflowing bin at stop #4',
    triggeredAt: new Date('2025-02-01T08:30:00.000Z'),
    acknowledged: false,
  },
  {
    id: 'alert-002',
    routeCode: 'R3',
    type: 'UPDATE_REQUIRED',
    severity: 'MEDIUM',
    message: 'Firmware update required for sensor SN-3491',
    triggeredAt: new Date('2025-02-02T12:10:00.000Z'),
    acknowledged: true,
  },
  {
    id: 'alert-003',
    routeCode: 'R7',
    type: 'IOT_WARNING',
    severity: 'LOW',
    message: 'Irregular weight pattern detected for bin BIN-92',
    triggeredAt: new Date('2025-02-02T15:45:00.000Z'),
    acknowledged: false,
  },
];

const listAlerts = () =>
  dummyAlerts
    .map((alert) => ({
      ...alert,
      triggeredAt: alert.triggeredAt.toISOString(),
    }))
    .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));

export default {
  listAlerts,
};

export { dummyAlerts };
