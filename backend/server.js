import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import scheduleRoutes from './routes/ScheduleRoutes.js';
import collectionRouteRoutes from './routes/CollectionRouteRoutes.js';
import errorHandler from './middlewares/ErrorMiddleware.js';
import notificationRoutes from './routes/NotificationRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authJwt from './middlewares/authJwt.js';
import mockUser from './middlewares/mockUser.js';
import billRoutes from './routes/BillRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';
import wasteSubmissionRoutes from './routes/WasteSubmissionRoutes.js';
import initNotifications from './init/notifications.js';

dotenv.config();
await connectDB();

const app = express();

const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined;
app.use(
  cors({
    origin: corsOrigins || '*',
    allowedHeaders: ['Content-Type', 'x-user-id', 'authorization'],
  })
);
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

app.use(authJwt);
app.use(mockUser);

app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

const notificationService = initNotifications();
export { notificationService };

// ✅ Basic test route
app.get('/', (req, res) => {
  res.send('Smart Waste Management Backend Running');
});

app.use('/api/waste-submissions', wasteSubmissionRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));