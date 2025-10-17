import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authJwt from './middlewares/authJwt.js';
import mockUser from './middlewares/mockUser.js';
import billRoutes from './routes/BillRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';

// ✅ Load environment variables
dotenv.config();

// ✅ Connect to MongoDB
connectDB();

const app = express();

const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined;
app.use(
  cors({
    origin: corsOrigins || '*',
    allowedHeaders: ['Content-Type', 'x-user-id', 'authorization'],
  })
);
app.use(express.json());

app.use(authJwt);
app.use(mockUser);

app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Basic test route
app.get('/', (req, res) => {
  res.send('Smart Waste Management Backend Running');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
