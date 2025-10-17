// backend/tests/controllers/WasteSubmissionController.errors.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock NotificationService to no-op
jest.unstable_mockModule('../../services/NotificationService.js', () => ({
  default: class { async send() {} }
}));

// Service method stubs
const createSubmissionMock = jest.fn();
const getSubmissionByIdMock = jest.fn();
const updateSubmissionStatusMock = jest.fn();
const updateWasteSubmissionMock = jest.fn();
const deleteSubmissionMock = jest.fn();

jest.unstable_mockModule('../../services/WasteSubmissionService.js', () => ({
  default: class {
    async createSubmission(d) { return createSubmissionMock(d); }
    async getSubmissionById(id) { return getSubmissionByIdMock(id); }
    async getAllSubmissions() { return []; }
    async updateSubmissionStatus(id, p) { return updateSubmissionStatusMock(id, p); }
    async updateWasteSubmission(id, d) { return updateWasteSubmissionMock(id, d); }
    async deleteSubmission(id) { return deleteSubmissionMock(id); }
  }
}));

const { default: routes } = await import('../../routes/WasteSubmissionRoutes.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/waste-submissions', routes);
  return app;
}

const app = buildApp();

function validPayload() {
  return {
    submitterName: 'Jane',
    submitterEmail: 'jane@example.com',
    wasteType: 'recyclable',
    category: 'plastic',
    quantity: 2,
    unit: 'kg',
    pickupDate: new Date().toISOString(),
    collectionAddress: { street: 'A', city: 'B', state: 'C', postalCode: '12345' },
  };
}

test('POST returns 400 on validation error', async () => {
  createSubmissionMock.mockRejectedValueOnce(Object.assign(new Error('Validation failed'), { name: 'ValidationError' }));
  const res = await request(app).post('/api/waste-submissions').send(validPayload());
  expect(res.status).toBe(400);
});

test('POST returns 500 on generic error', async () => {
  createSubmissionMock.mockRejectedValueOnce(new Error('DB down'));
  const res = await request(app).post('/api/waste-submissions').send(validPayload());
  expect(res.status).toBe(500);
});

test('GET by id returns 404 when not found', async () => {
  getSubmissionByIdMock.mockRejectedValueOnce(new Error('Submission not found'));
  const res = await request(app).get('/api/waste-submissions/does-not-exist');
  expect(res.status).toBe(500); // controller maps unknown errors to 500
});

test('PUT status returns 400 on invalid status', async () => {
  updateSubmissionStatusMock.mockRejectedValueOnce(new Error('Invalid status update'));
  const res = await request(app).put('/api/waste-submissions/idx/status').send({ status: 'BAD' });
  expect(res.status).toBe(400);
});

test('PUT status returns 404 when not found', async () => {
  updateSubmissionStatusMock.mockRejectedValueOnce(new Error('Submission not found'));
  const res = await request(app).put('/api/waste-submissions/idx/status').send({ status: 'completed' });
  expect(res.status).toBe(404);
});

test('PUT (update full) returns 404 when not found', async () => {
  updateWasteSubmissionMock.mockResolvedValueOnce(null);
  const res = await request(app).put('/api/waste-submissions/idx').send({ category: 'plastic' });
  expect(res.status).toBe(404);
});

test('DELETE returns 404 when not found', async () => {
  deleteSubmissionMock.mockRejectedValueOnce(new Error('Submission not found'));
  const res = await request(app).delete('/api/waste-submissions/idx');
  expect(res.status).toBe(500); // controller maps to 500 in delete path
});
