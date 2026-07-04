const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

require("dotenv").config();

const { connect } = require("./config/database");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");

// Import routes
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const profileRoutes = require("./routes/profiles");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const emailRoutes = require("./routes/email");
const graduateRoutes = require("./routes/graduate");
const investorRoutes = require("./routes/investor");

const app = express();

// Trust proxy - use specific number instead of true to avoid rate limiter conflict
app.set("trust proxy", 1);

// Connect to MongoDB
connect();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/", apiLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}



// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/graduates", graduateRoutes);
app.use("/api/investors", investorRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "MongoDB",
    environment: process.env.NODE_ENV || "development",
  });
});

// Root
app.get("/", (_req, res) => {
  res.json({
    message: "ALU Graduates Empowerment Platform API",
    version: "1.0.0",
    health: "/api/health",
    endpoints: {
      auth: "/api/auth",
      projects: "/api/projects",
      profiles: "/api/profiles",
      messages: "/api/messages",
      users: "/api/users",
      admin: "/api/admin",
      email: "/api/email",
      graduates: "/api/graduates",
      investors: "/api/investors",
    },
  });
});

// 404 handler
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Global error handler
app.use((error, _req, res, _next) => {
  res.status(error.status || 500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  });
});


module.exports = app;
