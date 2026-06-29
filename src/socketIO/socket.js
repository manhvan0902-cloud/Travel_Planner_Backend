const { Server } = require("socket.io");
const { authenticateSocketMiddleware } = require("../middlewares/socketMiddleware.js");

let io;
const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
      allowEIO3: true,
    },
  });

  // Gắn Middleware xác thực
  io.use(authenticateSocketMiddleware);

  io.on("connection", (socket) => {
    const user = socket.user;
    const identifier = user.username || user.full_name || user.id;
    console.log(`${identifier} connected with socket id ${socket.id}`);
    
    onlineUsers.set(user.id, { socketId: socket.id, user });
    io.emit("onlineUsers", Array.from(onlineUsers.values()).map(u => u.user));

    socket.on("disconnect", () => {
      console.log(`${identifier} disconnected with socket id ${socket.id}`);
      onlineUsers.delete(user.id);
      io.emit("onlineUsers", Array.from(onlineUsers.values()).map(u => u.user));
    });
  });

  io.engine.on("connection_error", (err) => {
    console.log(err);
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

const getOnlineUsers = () => {
  return onlineUsers;
};

const emitToUser = (userId, eventName, data) => {
  const userSocket = onlineUsers.get(userId);
  if (userSocket) {
    io.to(userSocket.socketId).emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  getOnlineUsers,
  emitToUser
};
