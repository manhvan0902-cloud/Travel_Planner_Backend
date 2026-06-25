const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { generateTokens } = require("../utils/tokenUtils");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng."
      });
    }

    const newUser = await User.create({
      full_name,
      email,
      password,
    });

    const { accessToken, refreshToken } = generateTokens(newUser);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    await RefreshToken.create({
      user_id: newUser.id,
      token_hash: hashToken(refreshToken),
      expires_at: expiresAt,
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký người dùng thành công.",
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ."
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không hợp lệ."
      });
    }

    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không hợp lệ."
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: expiresAt,
    });

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ."
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Yêu cầu phải có refresh token."
      });
    }

    const tokenHash = hashToken(refreshToken);
    const rt = await RefreshToken.findOne({
      where: {
        token_hash: tokenHash,
        revoked: false
      }
    });

    if (!rt) {
      return res.status(403).json({
        success: false,
        message: "Refresh token không hợp lệ hoặc đã bị thu hồi."
      });
    }

    if (new Date() > rt.expires_at) {
      rt.revoked = true;
      await rt.save();
      
      return res.status(403).json({
        success: false,
        message: "Refresh token đã hết hạn."
      });
    }

    const user = await User.findByPk(rt.user_id);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Người dùng không còn tồn tại."
      });
    }

    const newTokens = generateTokens(user);
    rt.revoked = true;
    await rt.save();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await RefreshToken.create({
      user_id: user.id,
      token_hash: hashToken(newTokens.refreshToken),
      expires_at: expiresAt,
    });

    res.status(200).json({
      success: true,
      message: "Làm mới token thành công.",
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ."
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Yêu cầu phải có refresh token để đăng xuất."
      });
    }

    const tokenHash = hashToken(refreshToken);
    const rt = await RefreshToken.findOne({
      where: { token_hash: tokenHash }
    });

    if (!rt) {
      return res.status(400).json({
        success: false,
        message: "Refresh token không hợp lệ."
      });
    }

    if (rt.revoked) {
      return res.status(200).json({
        success: true,
        message: "Bạn đã đăng xuất rồi."
      });
    }

    rt.revoked = true;
    await rt.save();

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công."
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ."
    });
  }
};
