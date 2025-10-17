import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import scheduleRoutes from './routes/ScheduleRoutes.js';
import collectionRouteRoutes from './routes/CollectionRouteRoutes.js';
import errorHandler from './middlewares/ErrorMiddleware.js';
import notificationRoutes from './routes/NotificationRoutes.js';

dotenv.config();
await connectDB();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Clean routing structure
app.use('/api/schedules', scheduleRoutes);
app.use('/api/collection-routes', collectionRouteRoutes);
app.use('/api/alerts', notificationRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
