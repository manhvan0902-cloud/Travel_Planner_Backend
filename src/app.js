const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

//middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

//import routes
const authRoute = require("./routes/authRoute");

//public route
app.use("/api/auth", authRoute);

//private route

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: "Error server:",
    error: err.message,
  });
});

//Test route
app.use("/api/status", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend Travel Planner API is running",
    Timestamp: new Date(),
  });
});

module.exports = app;
