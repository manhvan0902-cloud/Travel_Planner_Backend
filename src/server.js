const http = require("http");
const app = require("./app");
const { sequelize } = require("./configs/database.js");
const { initSocket } = require("./socketIO/socket.js");

require("dotenv").config();
require("./configs/firebase.js");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  server.listen(PORT, () => {
    console.log(`----- Server is running on port ${PORT} -----`);
  });
  try {
    await sequelize.authenticate();
    console.log("------ Connect to database successfully ------");
  } catch (error) {
    console.error("❌ Error connecting to the database:", error);
  }
};

startServer();
