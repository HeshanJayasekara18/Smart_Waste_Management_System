// backend/tests/setup/server.js
import express from 'express';
import cors from 'cors';
import wasteSubmissionRoutes from '../../routes/WasteSubmissionRoutes.js';

export function buildTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/waste-submissions', wasteSubmissionRoutes);
  // health
  app.get('/health', (req, res) => res.json({ ok: true }));
  return app;
}
