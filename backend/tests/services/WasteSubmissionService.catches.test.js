// backend/tests/services/WasteSubmissionService.catches.test.js
import { jest } from '@jest/globals';

const saveMock = jest.fn();
const findMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();
const findByIdAndDeleteMock = jest.fn();

jest.unstable_mockModule('../../services/NotificationFactory.js', () => ({
  default: { create: () => ({ sendNotification: jest.fn().mockResolvedValue() }) }
}));

jest.unstable_mockModule('../../models/SpecialWasteModel.js', () => ({
  default: class MockModel {
    constructor(data) { Object.assign(this, data); this.save = saveMock; }
    static find() { return { sort: () => findMock() }; }
    static findByIdAndUpdate(id, data) { return findByIdAndUpdateMock(id, data); }
    static findByIdAndDelete(id) { return findByIdAndDeleteMock(id); }
  },
  __esModule: true
}));

const { default: WasteSubmissionService } = await import('../../services/WasteSubmissionService.js');

beforeEach(() => {
  saveMock.mockReset();
  findMock.mockReset();
  findByIdAndUpdateMock.mockReset();
  findByIdAndDeleteMock.mockReset();
});

test('createSubmission catch path rethrows error', async () => {
  const svc = new WasteSubmissionService();
  saveMock.mockRejectedValueOnce(new Error('save-fail'));
  await expect(svc.createSubmission({})).rejects.toThrow(/save-fail/);
});

test('getAllSubmissions catch path rethrows error', async () => {
  const svc = new WasteSubmissionService();
  findMock.mockRejectedValueOnce(new Error('find-fail'));
  await expect(svc.getAllSubmissions()).rejects.toThrow(/find-fail/);
});

test('updateWasteSubmission catch path rethrows error', async () => {
  const svc = new WasteSubmissionService();
  findByIdAndUpdateMock.mockRejectedValueOnce(new Error('update-fail'));
  await expect(svc.updateWasteSubmission('x', {})).rejects.toThrow(/update-fail/);
});

test('deleteSubmission catch path rethrows error', async () => {
  const svc = new WasteSubmissionService();
  findByIdAndDeleteMock.mockRejectedValueOnce(new Error('delete-fail'));
  await expect(svc.deleteSubmission('x')).rejects.toThrow(/delete-fail/);
});
