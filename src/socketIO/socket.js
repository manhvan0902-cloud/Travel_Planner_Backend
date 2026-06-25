const { Server } = require("socket.io");
const { authenticateSocketMiddleware } = require("../middlewares/socketMiddleware.js");

let io;

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
    console.log(`${user.username} connected with socket id ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`${user.username} disconnected with socket id ${socket.id}`);
      onlineUsers.delete(user.id);
      io.emit("onlineUsers", Array.from(onlineUsers.values()));
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

module.exports = {
  initSocket,
  getIo,
};
