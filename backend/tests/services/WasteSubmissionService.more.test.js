// backend/tests/services/WasteSubmissionService.more.test.js
import { jest } from '@jest/globals';

const findMock = jest.fn();
const findByIdMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();
const findByIdAndDeleteMock = jest.fn();

jest.unstable_mockModule('../../services/NotificationFactory.js', () => ({
  default: { create: () => ({ sendNotification: jest.fn().mockResolvedValue() }) }
}));

jest.unstable_mockModule('../../models/SpecialWasteModel.js', () => ({
  default: class MockModel {
    static find() { return { sort: () => findMock() }; }
    static findById(id) { return findByIdMock(id); }
    static findByIdAndUpdate(id, data) { return findByIdAndUpdateMock(id, data); }
    static findByIdAndDelete(id) { return findByIdAndDeleteMock(id); }
  },
  __esModule: true
}));

const { default: WasteSubmissionService } = await import('../../services/WasteSubmissionService.js');

beforeEach(() => {
  findMock.mockReset();
  findByIdMock.mockReset();
  findByIdAndUpdateMock.mockReset();
  findByIdAndDeleteMock.mockReset();
});

test('getAllSubmissions returns list', async () => {
  const svc = new WasteSubmissionService();
  findMock.mockResolvedValueOnce([{ _id: '1' }, { _id: '2' }]);
  const res = await svc.getAllSubmissions();
  expect(Array.isArray(res)).toBe(true);
  expect(res.length).toBe(2);
});

test('getSubmissionById returns object', async () => {
  const svc = new WasteSubmissionService();
  findByIdMock.mockResolvedValueOnce({ _id: 'xyz' });
  const res = await svc.getSubmissionById('xyz');
  expect(res._id).toBe('xyz');
});

test('updateWasteSubmission returns updated document', async () => {
  const svc = new WasteSubmissionService();
  findByIdAndUpdateMock.mockResolvedValueOnce({ _id: 'a1', category: 'plastic' });
  const res = await svc.updateWasteSubmission('a1', { category: 'plastic' });
  expect(res.category).toBe('plastic');
});

test('deleteSubmission returns deleted document', async () => {
  const svc = new WasteSubmissionService();
  findByIdAndDeleteMock.mockResolvedValueOnce({ _id: 'd1' });
  const res = await svc.deleteSubmission('d1');
  expect(res._id).toBe('d1');
});
