const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

exports.authenticateSocketMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.headers["authorization"]?.split(" ")[1] ||
      socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication error - no token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    if (!decoded) {
      return next(new Error("Authentication error - invalid token"));
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return next(new Error("Authentication error - user not found"));
    }
    socket.user = user;
    next();
  } catch (error) {
    console.error("Error when verify JWT in socketMiddleware: ", error);
    next(error);
  }
};
