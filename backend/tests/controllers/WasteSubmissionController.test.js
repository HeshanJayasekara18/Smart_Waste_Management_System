// backend/tests/controllers/WasteSubmissionController.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock NotificationService to no-op
jest.unstable_mockModule('../../services/NotificationService.js', () => ({
  default: class {
    async send() { /* no-op */ }
  }
}));

// Mock WasteSubmissionService methods used by controller
const createSubmissionMock = jest.fn();
const getAllSubmissionsMock = jest.fn();
const updateSubmissionStatusMock = jest.fn();

jest.unstable_mockModule('../../services/WasteSubmissionService.js', () => ({
  default: class {
    async createSubmission(data) { return createSubmissionMock(data); }
    async getAllSubmissions() { return getAllSubmissionsMock(); }
    async updateSubmissionStatus(id, payload) { return updateSubmissionStatusMock(id, payload); }
  }
}));

// Import routes AFTER mocks
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

test('POST /api/waste-submissions creates submission', async () => {
  createSubmissionMock.mockResolvedValueOnce({ _id: 'id1', ...validPayload() });
  const res = await request(app).post('/api/waste-submissions').send(validPayload());
  expect(res.status).toBe(201);
  expect(res.body?.data?._id).toBe('id1');
});

test('GET /api/waste-submissions returns list', async () => {
  getAllSubmissionsMock.mockResolvedValueOnce([{ _id: 'x' }]);
  const res = await request(app).get('/api/waste-submissions');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('PUT /api/waste-submissions/:id/status supports completed', async () => {
  updateSubmissionStatusMock.mockResolvedValueOnce({ _id: 'id2', status: 'completed' });
  const res = await request(app).put('/api/waste-submissions/id2/status').send({ status: 'completed' });
  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe('completed');
});
