const User = require("../models/User");


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
        error: error.message,

      });
    }
    res.status(200).json({
      success: true,
      message: "Lấy thông tin cá nhân thành công.",
      user
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, bio } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy người dùng",
        error: error.message,
     });
    }

    if (full_name !== undefined) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.status(200).json({ 
        success: true, 
        message: "Cập nhật profile thành công.", 
        user: updatedUser 
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ.",
      error: error.message,
    });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn ảnh để upload." 
    });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy người dùng"
    });
    }

    user.avatar = req.file.path;
    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.status(200).json({ 
        success: true,  
        message: "Upload ảnh đại diện thành công.", 
        user: updatedUser 
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    res.status(500).json({ 
        success: false, 
        message: "Lỗi máy chủ nội bộ.",
        error: error.message,  
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { language, dark_mode } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy người dùng",
        error: error.message,  
    });
    }

    if (language !== undefined) user.language = language;
    if (dark_mode !== undefined) user.dark_mode = dark_mode;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.status(200).json({ 
        success: true, 
        message: "Cập nhật cài đặt thành công.", 
        user: updatedUser 
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ 
        success: false, 
        message: "Lỗi máy chủ nội bộ.",
        error: error.message,  
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy người dùng",
        error: error.message,  
    });
    }

    await user.destroy();

    res.status(200).json({ 
        success: true, 
        message: "Xóa tài khoản thành công." 
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
  }
};
