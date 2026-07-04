// Socket Handlers for real-time communication
const socketHandlers = (io) => {
  io.on("connection", (socket) => {


    // Join a specific room (e.g. conversation between two users)
    socket.on("joinRoom", ({ roomId }) => {
      socket.join(roomId);
    });

    // Leave a room
    socket.on("leaveRoom", ({ roomId }) => {
      socket.leave(roomId);
    });

    // Send a message to a room
    socket.on("sendMessage", ({ roomId, message }) => {
      io.to(roomId).emit("receiveMessage", message);
    });

    // Typing indicator
    socket.on("typing", ({ roomId, userId }) => {
      socket.to(roomId).emit("userTyping", { userId });
    });

    socket.on("stopTyping", ({ roomId, userId }) => {
      socket.to(roomId).emit("userStoppedTyping", { userId });
    });

    socket.on("disconnect", () => {
      // cleanup if needed
    });
  });
};

module.exports = socketHandlers;
