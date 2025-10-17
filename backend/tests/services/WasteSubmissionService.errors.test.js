// backend/tests/services/WasteSubmissionService.errors.test.js
import { jest } from '@jest/globals';

// Mocks BEFORE import
const findByIdAndUpdateMock = jest.fn();
const findByIdAndDeleteMock = jest.fn();

jest.unstable_mockModule('../../services/NotificationFactory.js', () => ({
  default: { create: () => ({ sendNotification: jest.fn().mockResolvedValue() }) }
}));

jest.unstable_mockModule('../../models/SpecialWasteModel.js', () => {
  function MockModel() {}
  MockModel.findByIdAndUpdate = findByIdAndUpdateMock;
  MockModel.findByIdAndDelete = findByIdAndDeleteMock;
  return { default: MockModel, __esModule: true };
});

const { default: WasteSubmissionService } = await import('../../services/WasteSubmissionService.js');

beforeEach(() => {
  findByIdAndUpdateMock.mockReset();
  findByIdAndDeleteMock.mockReset();
});

test('updateSubmissionStatus throws on invalid status', async () => {
  const svc = new WasteSubmissionService();
  await expect(svc.updateSubmissionStatus('id', { status: 'UNKNOWN' }))
    .rejects.toThrow(/Invalid status update/i);
});

test('updateSubmissionStatus throws when not found', async () => {
  const svc = new WasteSubmissionService();
  findByIdAndUpdateMock.mockResolvedValueOnce(null);
  await expect(svc.updateSubmissionStatus('missing', { status: 'completed' }))
    .rejects.toThrow(/Submission not found/i);
});

test('deleteSubmission throws when not found', async () => {
  const svc = new WasteSubmissionService();
  findByIdAndDeleteMock.mockResolvedValueOnce(null);
  await expect(svc.deleteSubmission('missing')).rejects.toThrow(/Submission not found/i);
});
