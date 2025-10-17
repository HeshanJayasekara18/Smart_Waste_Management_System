import WasteSubmissionService from '../../services/WasteSubmissionService';

// Use the API mock provided by setupTests and override per-test implementations
const api = require('../../api/WasteSubmissionAPI').default;
beforeEach(() => {
  api.create.mockResolvedValue({ id: 'x' });
  api.list.mockResolvedValue([
    { _id: '1', status: 'approved', wasteType: 'recyclable', paybackAmount: 10 },
    { _id: '2', status: 'pending', wasteType: 'organic' },
    { _id: '3', status: 'rejected', wasteType: 'plastic', paybackAmount: 5 },
  ]);
  api.get.mockImplementation(async (id) => ({ _id: id }));
  api.update.mockImplementation(async (id, d) => ({ _id: id, ...d }));
  api.updateStatus.mockImplementation(async (id, d) => ({ _id: id, ...d }));
  api.remove.mockImplementation(async (id) => ({ ok: true, _id: id }));
});

describe('WasteSubmissionService', () => {
  test('create validates and forwards to API', async () => {
    const data = {
      submitterName: 'A', submitterEmail: 'a@b.com', wasteType: 'recyclable', category: 'paper',
      quantity: 1, unit: 'kg', pickupDate: new Date(Date.now() + 86400000).toISOString(),
      location: 'loc', collectionAddress: {}, paymentRequired: false
    };
    const res = await WasteSubmissionService.create(data);
    expect(res.id).toBeDefined();
  });

  test('list returns array', async () => {
    const res = await WasteSubmissionService.list();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });

  test('getStats aggregates recyclableCount and totalPayback', async () => {
    const res = await WasteSubmissionService.getStats();
    expect(res.recyclableCount).toBe(1);
    expect(res.totalPayback).toBe(15);
  });

  test('getStatistics counts by status', async () => {
    const res = await WasteSubmissionService.getStatistics();
    expect(res.totalRequests).toBe(3);
    expect(res.approved).toBe(1);
    expect(res.pending).toBe(1);
    expect(res.rejected).toBe(1);
  });

  test('updateRequestStatus delegates to API', async () => {
    const res = await WasteSubmissionService.updateRequestStatus('1', { status: 'approved' });
    expect(res.status).toBe('approved');
  });
});
