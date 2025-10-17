// backend/tests/models/SpecialWasteModel.test.js
import WasteSubmission from '../../models/SpecialWasteModel.js';

function validSubmission() {
  return {
    submitterName: 'Jane',
    submitterEmail: 'jane@example.com',
    wasteType: 'recyclable',
    category: 'plastic',
    quantity: 2,
    unit: 'kg',
    pickupDate: new Date(),
    collectionAddress: { street: 'A', city: 'B', state: 'C', postalCode: '12345' },
  };
}

test('saves a valid submission and defaults', async () => {
  const doc = new WasteSubmission(validSubmission());
  await expect(doc.validate()).resolves.toBeUndefined();
  expect(doc.status).toBe('pending');
  expect(doc.paybackAmount).toBe(0);
  expect(doc.rejectionReason).toBeDefined();
});

test('rejects invalid email', async () => {
  const data = validSubmission();
  data.submitterEmail = 'not-an-email';
  const doc = new WasteSubmission(data);
  await expect(doc.validate()).rejects.toThrow();
});

test('rejects quantity < 1', async () => {
  const data = validSubmission();
  data.quantity = 0;
  const doc = new WasteSubmission(data);
  await expect(doc.validate()).rejects.toThrow();
});
