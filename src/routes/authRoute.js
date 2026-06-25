const express = require("express");
const router = express.Router();
const { register, login, refreshToken, logout } = require("../controllers/authController.js");
const authenticateToken = require("../middlewares/authMiddleware.js");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateToken, logout);

module.exports = router;
