const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const OtpCode = require("../models/OtpCode");
const { generateTokens } = require("../utils/tokenUtils");
const sendEmail = require("../utils/sendEmail");

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp email." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashToken(otp);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await OtpCode.destroy({ 
      where: { user_id: user.id, purpose: "forgot_password", is_used: false } 
    });

    await OtpCode.create({
      user_id: user.id,
      code_hash: otpHash,
      purpose: "forgot_password",
      expires_at: expiresAt,
    });

    const emailSent = await sendEmail({
      email: user.email,
      subject: "Mã OTP khôi phục mật khẩu",
      message: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn trong 5 phút.`,
    });

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Không thể gửi email OTP." });
    }

    res.status(200).json({ success: true, message: "Mã OTP đã được gửi đến email của bạn." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ nội bộ.",
      error: error.message
     });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp email và mã OTP." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    const otpRecord = await OtpCode.findOne({
      where: { user_id: user.id, purpose: "forgot_password", is_used: false },
      order: [["created_at", "DESC"]],
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn." });
    }

    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn." });
    }

    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return res.status(400).json({ success: false, message: "Bạn đã nhập sai quá số lần quy định. Vui lòng yêu cầu mã mới." });
    }

    const isMatch = hashToken(otp) === otpRecord.code_hash;
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Mã OTP không chính xác." });
    }

    // OTP is correct
    otpRecord.is_used = true;
    await otpRecord.save();

    res.status(200).json({ success: true, message: "Xác thực OTP thành công." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ.",
      error: error.message
     });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp email và mật khẩu mới." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    const recentUsedOtp = await OtpCode.findOne({
      where: { user_id: user.id, purpose: "forgot_password", is_used: true },
      order: [["created_at", "DESC"]],
    });

    if (!recentUsedOtp) {
      return res.status(400).json({ success: false, message: "Vui lòng xác thực OTP trước khi đổi mật khẩu." });
    }

    user.password = newPassword;
    await user.save();

    await OtpCode.destroy({ where: { user_id: user.id, purpose: "forgot_password" } });

    res.status(200).json({ success: true, message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ.",
      error: error.message
     });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp mật khẩu cũ và mật khẩu mới." });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    }

    const isMatch = await user.validPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới và mật khẩu xác nhận không khớp." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Thay đổi mật khẩu thành công." 
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ.",
      error: error.message 
    });
  }
};