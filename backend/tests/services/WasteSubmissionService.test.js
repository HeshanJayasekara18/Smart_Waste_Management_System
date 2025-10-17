// backend/tests/services/WasteSubmissionService.test.js
import { jest } from '@jest/globals';

// Prepare mocks BEFORE importing the service under test
const saveMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();

jest.unstable_mockModule('../../services/NotificationFactory.js', () => ({
  default: { create: () => ({ sendNotification: jest.fn().mockResolvedValue() }) }
}));

jest.unstable_mockModule('../../models/SpecialWasteModel.js', () => {
  function MockModel(data) {
    Object.assign(this, data);
    this.status = this.status || 'pending';
    this.paybackAmount = this.paybackAmount ?? 0;
    this.rejectionReason = this.rejectionReason ?? '';
    this.save = saveMock;
  }
  // attach static used by service
  MockModel.findByIdAndUpdate = findByIdAndUpdateMock;
  return { default: MockModel, __esModule: true };
});

// Now import the service (will receive mocked deps)
const { default: WasteSubmissionService } = await import('../../services/WasteSubmissionService.js');

function baseSubmission() {
  return {
    submitterName: 'Tester',
    submitterEmail: 'tester@example.com',
    wasteType: 'recyclable',
    category: 'plastic',
    quantity: 3,
    unit: 'kg',
    pickupDate: new Date(),
    collectionAddress: { street: 'A', city: 'B', state: 'C', postalCode: '12345' },
  };
}

test('createSubmission saves and returns document', async () => {
  const svc = new WasteSubmissionService();
  saveMock.mockResolvedValueOnce();
  const created = await svc.createSubmission(baseSubmission());
  expect(created).toBeDefined();
  expect(created.status).toBe('pending');
});

test('updateSubmissionStatus: approved sets payback and clears rejectionReason', async () => {
  const svc = new WasteSubmissionService();
  saveMock.mockResolvedValueOnce();
  const created = await svc.createSubmission(baseSubmission());
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...created, status: 'approved', paybackAmount: 250, rejectionReason: '' });
  const updated = await svc.updateSubmissionStatus('some-id', { status: 'approved', paybackAmount: 250 });
  expect(updated.status).toBe('approved');
  expect(updated.paybackAmount).toBe(250);
  expect(updated.rejectionReason).toBe('');
});

test('updateSubmissionStatus: rejected sets reason and zeroes payback', async () => {
  const svc = new WasteSubmissionService();
  saveMock.mockResolvedValueOnce();
  const created = await svc.createSubmission(baseSubmission());
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...created, status: 'rejected', paybackAmount: 0, rejectionReason: 'Not eligible' });
  const updated = await svc.updateSubmissionStatus('some-id', { status: 'rejected', rejectionReason: 'Not eligible' });
  expect(updated.status).toBe('rejected');
  expect(updated.rejectionReason).toBe('Not eligible');
  expect(updated.paybackAmount).toBe(0);
});

test('updateSubmissionStatus: normalizes complte -> completed', async () => {
  const svc = new WasteSubmissionService();
  saveMock.mockResolvedValueOnce();
  const created = await svc.createSubmission(baseSubmission());
  findByIdAndUpdateMock.mockResolvedValueOnce({ ...created, status: 'completed' });
  const updated = await svc.updateSubmissionStatus('some-id', { status: 'complte' });
  expect(updated.status).toBe('completed');
});
