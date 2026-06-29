const { Trip, TripMember, User, Notification } = require("../models/index.js");
const { emitToUser } = require("../socketIO/socket.js");

// 1. Xem danh sách thành viên của 1 chuyến đi
exports.getMembers = async (req, res) => {
  try {
    const { trip_id } = req.params;

    const members = await TripMember.findAll({
      where: { trip_id },
      include: [
        {
          model: User,
          attributes: ["full_name", "avatar"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách thành viên thành công",
      data: members,
    });
  } catch (error) {
    console.error("Error in getMembers:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server", 
      error: error.message 
    }); 
  }
};

// 2. Mời thành viên
exports.inviteMember = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const { user_id } = req.body; // user được mời
    const currentUserId = req.user.id;
    const currentUserFullName = req.user.full_name || "Someone";

    const trip = await Trip.findByPk(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chuyến đi" });
    }
    if (trip.lead_id !== currentUserId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền mời thành viên" });
    }

    const userToInvite = await User.findByPk(user_id);
    if (!userToInvite) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user cần mời" });
    }

    const existingMember = await TripMember.findOne({
      where: { trip_id, user_id },
    });

    if (existingMember) {
      return res.status(400).json({ success: false, message: "User đã ở trong chuyến đi hoặc đã được mời" });
    }

    await TripMember.create({
      trip_id,
      user_id,
      role: "member",
      status: "pending",
    });

    const notification = await Notification.create({
      user_id: user_id,
      type: "trip_invite",
      title: "Lời mời tham gia chuyến đi",
      body: `${currentUserFullName} đã mời bạn tham gia chuyến đi. "${trip.title}".`,
      metadata: {
        tripId: trip.id,
        senderId: currentUserId,
        senderName: currentUserFullName,
        title: trip.title
      },
    });

    // Realtime notification cho user được mời
    emitToUser(user_id, "newNotification", notification);

    res.status(200).json({
      success: true,
      message: "Đã gửi lời mời thành công",
      data: {
        tripId: trip.id,
        trip: trip.title,
        senderName: currentUserFullName,
        receiverName: userToInvite.full_name,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error in inviteMember:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server", 
      error: error.message 
    });
  }
};

// 3. Chấp nhận lời mời
exports.acceptInvitation = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const currentUserId = req.user.id;
    const currentUserFullName = req.user.full_name || "Someone";

    const member = await TripMember.findOne({
      where: { trip_id, user_id: currentUserId, status: "pending" },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lời mời hoặc đã xử lý" });
    }

    member.status = "accepted";
    member.joined_at = new Date();
    await member.save();

    // Thông báo realtime cho Lead
    const trip = await Trip.findByPk(trip_id);
    if (trip) {
      const notification = await Notification.create({
        user_id: trip.lead_id,
        type: "member_joined",
        title: "Thành viên mới",
        body: `${currentUserFullName} đã chấp nhận lời mời tham gia chuyến đi "${trip.title}".`,
        metadata: {
          tripId: trip.id,
          senderId: currentUserId,
          senderName: currentUserFullName,
        },
      });
      emitToUser(trip.lead_id, "newNotification", notification);
    }

    res.status(200).json({
      success: true,
      message: `${currentUserFullName} Đã chấp nhận lời mời tham gia chuyến đi.`
    });
  } catch (error) {
    console.error("Error in acceptInvitation:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server", 
      error: error.message 
    });
  }
};

// 4. Từ chối lời mời
exports.rejectInvitation = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const currentUserId = req.user.id;

    const member = await TripMember.findOne({
      where: { trip_id, user_id: currentUserId, status: "pending" },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lời mời hoặc đã xử lý" });
    }

    member.status = "rejected";
    await member.save();

    const trip = await Trip.findByPk(trip_id);
    if (trip) {
      emitToUser(trip.lead_id, "memberRejected", {
        tripId: trip.id,
        userId: currentUserId,
        userName: req.user.full_name || "Someone"
      });
    }

    res.status(200).json({
      success: true,
      message: `${req.user.full_name} đã từ chối lời mời tham gia chuyến đi ${trip.title}.`,
    });
  } catch (error) {
    console.error("Error in rejectInvitation:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server", 
      error: error.message 
    });
  }
};

// 5. Xóa thành viên (chỉ lead)
exports.removeMember = async (req, res) => {
  try {
    const { trip_id, user_id } = req.params; // user_id của thành viên cần xóa
    const currentUserId = req.user.id;

    const trip = await Trip.findByPk(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chuyến đi" });
    }
    if (trip.lead_id !== currentUserId) {
      return res.status(403).json({ success: false, message: "Chỉ trưởng nhóm (Lead) mới có quyền xóa thành viên" });
    }

    if (user_id === currentUserId) {
      return res.status(400).json({ success: false, message: "Bạn không thể tự xóa chính mình ra khỏi chuyến đi" });
    }

    const member = await TripMember.findOne({
      where: { trip_id, user_id },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thành viên trong chuyến đi" });
    }

    await member.destroy();

    // Cập nhật realtime cho người bị kick
    emitToUser(user_id, "memberRemoved", { tripId: trip.id, title: trip.title });

    // Cập nhật realtime cho các thành viên còn lại để họ update danh sách
    const remainingMembers = await TripMember.findAll({ where: { trip_id } });
    for (const m of remainingMembers) {
      emitToUser(m.user_id, "tripUpdated", trip);
    }

    res.status(200).json({
      success: true,
      message: `${req.user.full_name} đã xóa ${user_id} khỏi chuyến đi ${trip.title}.`
    });
  } catch (error) {
    console.error("Error in removeMember:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server", 
      error: error.message 
    });
  }
};
