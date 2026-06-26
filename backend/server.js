// backend/server.js
const http = require("http");
const app = require("./app"); // Express app
const socketHandlers = require("./socket/socketHandlers");

const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});
socketHandlers(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 API base: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`📁 Projects endpoints: http://localhost:${PORT}/api/projects`);
  console.log(`👤 Profile endpoints: http://localhost:${PORT}/api/profiles`);
  console.log(`💬 Messages endpoints: http://localhost:${PORT}/api/messages`);
  console.log(`👥 Users endpoints: http://localhost:${PORT}/api/users`);
  console.log(`⚙️  Admin endpoints: http://localhost:${PORT}/api/admin`);
  console.log(`✉️ Email restriction: Google emails only`);
  console.log(`🖼️ Image hosting: Google Drive links only`);
  console.log(`🎥 Video hosting: YouTube links only`);
  console.log(`📄 Document hosting: Google Drive links only`);
  console.log(`🎓 University restriction: African Leadership University only`);
  console.log(`📚 Major restriction: BSE, BEL, IBT only`);
  console.log(`🔌 Socket.IO enabled for real-time messaging`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    console.log(`💡 You can set a different port by running: PORT=5001 npm run dev`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
