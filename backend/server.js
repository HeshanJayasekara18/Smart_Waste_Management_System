const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authJwt = require('./middlewares/authJwt');
const mockUser = require('./middlewares/mockUser');
const billRoutes = require('./routes/BillRoutes');
const paymentRoutes = require('./routes/PaymentRoutes');
const adminRoutes = require('./routes/AdminRoutes');

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
