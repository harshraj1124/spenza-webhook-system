require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const { startRetryJob } = require("./controllers/webhookController");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());

// Rate limit the public webhook intake endpoint to prevent abuse
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down" }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: "Spenza webhook backend is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/webhooks", webhookRateLimit);
app.use("/api", webhookRoutes);

// Simple fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET is missing in .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startRetryJob();
    });
  } catch (error) {
    console.log("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();
