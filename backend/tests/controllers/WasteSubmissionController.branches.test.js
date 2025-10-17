// backend/tests/controllers/WasteSubmissionController.branches.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock NotificationService to no-op
jest.unstable_mockModule('../../services/NotificationService.js', () => ({
  default: class { async send() {} }
}));

// Service stubs
const getSubmissionByIdMock = jest.fn();
const getAllSubmissionsMock = jest.fn();
const updateSubmissionStatusMock = jest.fn();
const updateWasteSubmissionMock = jest.fn();
const deleteSubmissionMock = jest.fn();

jest.unstable_mockModule('../../services/WasteSubmissionService.js', () => ({
  default: class {
    async getSubmissionById(id) { return getSubmissionByIdMock(id); }
    async getAllSubmissions() { return getAllSubmissionsMock(); }
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

test('GET /:id returns 404 when service returns null', async () => {
  // Controller calls service and if (!submission) 404
  getSubmissionByIdMock.mockResolvedValueOnce(null);
  const res = await request(app).get('/api/waste-submissions/missing');
  expect(res.status).toBe(404);
});

test('GET / returns 500 on service error', async () => {
  getAllSubmissionsMock.mockRejectedValueOnce(new Error('boom'));
  const res = await request(app).get('/api/waste-submissions');
  expect(res.status).toBe(500);
});

test('PUT /:id/status returns 404 when service returns null', async () => {
  updateSubmissionStatusMock.mockResolvedValueOnce(null);
  const res = await request(app).put('/api/waste-submissions/x/status').send({ status: 'approved' });
  expect(res.status).toBe(404);
});

test('PUT /:id (full) returns 400 on service error', async () => {
  updateWasteSubmissionMock.mockRejectedValueOnce(new Error('bad-data'));
  const res = await request(app).put('/api/waste-submissions/x').send({ category: 'invalid' });
  expect(res.status).toBe(400);
});

test('DELETE /:id returns 404 when service returns null', async () => {
  deleteSubmissionMock.mockResolvedValueOnce(null);
  const res = await request(app).delete('/api/waste-submissions/x');
  expect(res.status).toBe(404);
});
