import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import wasteSubmissionRoutes from "./routes/WasteSubmissionRoutes.js";
import initNotifications from "./init/notifications.js";


// ✅ Load environment variables
dotenv.config();

// ✅ Connect to MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const notificationService = initNotifications();
export { notificationService };

// ✅ Basic test route
app.get("/", (req, res) => {
  res.send("Smart Waste Management Backend Running ✅");
});

app.use("/api/waste-submissions", wasteSubmissionRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));