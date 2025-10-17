// backend/tests/services/WasteSubmissionService.branches.test.js
import { jest } from '@jest/globals';

// Mocks BEFORE import
const saveMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();

// First, create a factory mock that we can flip to throw inside sendNotification
let shouldThrowOnNotify = false;
const sendNotificationMock = jest.fn(async () => {
  if (shouldThrowOnNotify) throw new Error('notify-fail');
});

jest.unstable_mockModule('../../services/NotificationFactory.js', () => ({
  default: { create: () => ({ sendNotification: sendNotificationMock }) }
}));

jest.unstable_mockModule('../../models/SpecialWasteModel.js', () => {
  function MockModel(data) { Object.assign(this, data); this.save = saveMock; }
  MockModel.findByIdAndUpdate = findByIdAndUpdateMock;
  return { default: MockModel, __esModule: true };
});

const { default: WasteSubmissionService } = await import('../../services/WasteSubmissionService.js');

beforeEach(() => {
  saveMock.mockReset();
  findByIdAndUpdateMock.mockReset();
  sendNotificationMock.mockClear();
  shouldThrowOnNotify = false;
});

test('updateSubmissionStatus: in-progress updates optional fields when provided', async () => {
  const svc = new WasteSubmissionService();
  // prime a created-like object to spread back
  const existing = { _id: 'id1', submitterEmail: 'a@b.c' };
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...existing, status: 'in-progress', paybackAmount: 10, rejectionReason: 'note' });
  const res = await svc.updateSubmissionStatus('id1', { status: 'in progress', paybackAmount: 10, rejectionReason: 'note' });
  expect(res.status).toBe('in-progress');
  expect(res.paybackAmount).toBe(10);
  expect(res.rejectionReason).toBe('note');
});

test('updateSubmissionStatus: pending skips optional fields when not provided', async () => {
  const svc = new WasteSubmissionService();
  const existing = { _id: 'id2', submitterEmail: 'a@b.c', paybackAmount: 0, rejectionReason: '' };
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...existing, status: 'pending' });
  const res = await svc.updateSubmissionStatus('id2', { status: 'pending' });
  expect(res.status).toBe('pending');
});

test('updateSubmissionStatus: notification failure is caught and does not throw', async () => {
  const svc = new WasteSubmissionService();
  const existing = { _id: 'id3', submitterEmail: 'a@b.c' };
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...existing, status: 'completed' });
  shouldThrowOnNotify = true;
  const res = await svc.updateSubmissionStatus('id3', { status: 'completed' });
  expect(res.status).toBe('completed');
  expect(sendNotificationMock).toHaveBeenCalledTimes(1);
});

test('createSubmission: notification failure is caught and does not throw', async () => {
  const svc = new WasteSubmissionService();
  saveMock.mockResolvedValueOnce();
  shouldThrowOnNotify = true;
  const created = await svc.createSubmission({ submitterEmail: 'x@y.z', submitterName: 'T' });
  expect(created).toBeDefined();
  expect(sendNotificationMock).toHaveBeenCalledTimes(1);
});

test('updateSubmissionStatus: rescheduled updates provided optional fields only', async () => {
  const svc = new WasteSubmissionService();
  const existing = { _id: 'id4', submitterEmail: 'a@b.c' };
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...existing, status: 'rescheduled', paybackAmount: 15, rejectionReason: 'later' });
  const res = await svc.updateSubmissionStatus('id4', { status: 'rescheduled', paybackAmount: 15, rejectionReason: 'later' });
  expect(res.status).toBe('rescheduled');
  expect(res.paybackAmount).toBe(15);
  expect(res.rejectionReason).toBe('later');
});

test('updateSubmissionStatus: approved defaults paybackAmount=0 and clears rejectionReason when not provided', async () => {
  const svc = new WasteSubmissionService();
  const existing = { _id: 'id5', submitterEmail: 'a@b.c' };
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...existing, status: 'approved', paybackAmount: 0, rejectionReason: '' });
  const res = await svc.updateSubmissionStatus('id5', { status: 'approved' });
  expect(res.status).toBe('approved');
  expect(res.paybackAmount).toBe(0);
  expect(res.rejectionReason).toBe('');
});

test('updateSubmissionStatus: rejected defaults rejectionReason empty and zeroes payback when not provided', async () => {
  const svc = new WasteSubmissionService();
  const existing = { _id: 'id6', submitterEmail: 'a@b.c' };
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...existing, status: 'rejected', paybackAmount: 0, rejectionReason: '' });
  const res = await svc.updateSubmissionStatus('id6', { status: 'rejected' });
  expect(res.status).toBe('rejected');
  expect(res.paybackAmount).toBe(0);
  expect(res.rejectionReason).toBe('');
});
