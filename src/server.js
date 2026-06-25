const http = require("http");
const app = require("./app");
const { sequelize } = require("./configs/database.js");
const { initSocket } = require("./socketIO/socket.js");

require("dotenv").config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("------ Connect to database successfully ------");

    server.listen(PORT, () => {
      console.log(`----- Server is running on port ${PORT} -----`);
    });
  } catch (error) {
    console.log("Error connecting to the database:", error);
  }
};

startServer();
