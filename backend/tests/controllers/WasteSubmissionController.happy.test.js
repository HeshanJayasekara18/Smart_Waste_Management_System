// backend/tests/controllers/WasteSubmissionController.happy.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock NotificationService to no-op
jest.unstable_mockModule('../../services/NotificationService.js', () => ({
  default: class { async send() {} }
}));

// Service method stubs
const getSubmissionByIdMock = jest.fn();
const updateWasteSubmissionMock = jest.fn();
const deleteSubmissionMock = jest.fn();

jest.unstable_mockModule('../../services/WasteSubmissionService.js', () => ({
  default: class {
    async getSubmissionById(id) { return getSubmissionByIdMock(id); }
    async updateWasteSubmission(id, d) { return updateWasteSubmissionMock(id, d); }
    async deleteSubmission(id) { return deleteSubmissionMock(id); }
    async getAllSubmissions() { return []; }
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

test('GET /api/waste-submissions/:id returns 200 with submission', async () => {
  getSubmissionByIdMock.mockResolvedValueOnce({ _id: 'abc', status: 'pending' });
  const res = await request(app).get('/api/waste-submissions/abc');
  expect(res.status).toBe(200);
  expect(res.body._id).toBe('abc');
});

test('PUT /api/waste-submissions/:id (full update) returns 200', async () => {
  updateWasteSubmissionMock.mockResolvedValueOnce({ _id: 'abc', category: 'plastic' });
  const res = await request(app).put('/api/waste-submissions/abc').send({ category: 'plastic' });
  expect(res.status).toBe(200);
  expect(res.body.data.category).toBe('plastic');
});

test('DELETE /api/waste-submissions/:id returns 200', async () => {
  deleteSubmissionMock.mockResolvedValueOnce({ _id: 'abc' });
  const res = await request(app).delete('/api/waste-submissions/abc');
  expect(res.status).toBe(200);
  expect(res.body.message).toMatch(/deleted successfully/i);
});
