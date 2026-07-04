// backend/server.js
const http = require("http");
const app = require("./app");
const socketHandlers = require("./socket/socketHandlers");

const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

socketHandlers(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Try: PORT=5001 npm run dev`);
  } else {
    console.error("❌ Server error:", error);
  }
  process.exit(1);
});

const shutdown = (signal) => {
  console.log(`\n👋 ${signal} received, shutting down gracefully`);
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));