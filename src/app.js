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
const userRoute = require("./routes/userRoute");
const tripRoute = require("./routes/tripRoute");
const memberTripRoute = require("./routes/memberTripRoute");
const notificationRoute = require("./routes/notificationRoute");
const memorieRoute = require("./routes/memorieRoutes");
const checkListRoute = require("./routes/checkListRoute");

//public route
app.use("/api/auth", authRoute);

//private route
app.use("/api/users", userRoute);
app.use("/api/trips", tripRoute);
app.use("/api/members_trip", memberTripRoute);  
app.use("/api/notifications", notificationRoute);
app.use("/api/memories", memorieRoute);
app.use("/api/checklists", checkListRoute);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: "Lỗi máy chủ:",
    error: err.message,
  });
});

//Test route
app.use("/api/status", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend Travel Planner API đang chạy",
    Timestamp: new Date(),
  });
});

module.exports = app;
