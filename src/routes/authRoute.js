const express = require("express");
const router = express.Router();
const { register, login, refreshToken, logout, forgotPassword, verifyOtp, resetPassword, changePassword } = require("../controllers/authController.js");
const authenticateToken = require("../middlewares/authMiddleware.js");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateToken, logout);

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticateToken, changePassword);

module.exports = router;
