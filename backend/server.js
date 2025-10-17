const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const scheduleRoutes = require('./routes/ScheduleRoutes');
const collectionRouteRoutes = require('./routes/CollectionRouteRoutes');
const errorHandler = require('./middlewares/ErrorMiddleware');

dotenv.config();
connectDB();

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
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
