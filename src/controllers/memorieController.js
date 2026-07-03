const { Memorie, Trip, TripMember, User, Notification } = require("../models/index.js");
const { cloudinary } = require("../configs/cloudinary");
const { emitToUser } = require("../socketIO/socket.js");

// Upload memories
exports.uploadMemories = async (req, res) => {
  try {
    const { trip_id, media_type, caption, taken_at } = req.body;
    const files = req.files;
    const userId = req.user.id;


    if (!trip_id) {
      return res.status(400).json({
        success: false,
        message: "Cần có trip_id",
      });
    }

    if(!files){
      return res.status(400).json({
        success: false,
        message: "Cần có ít nhất một file ảnh/video"
      })
    }
  
    const trip = await Trip.findByPk(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chuyến đi" });
    }

    const member = await TripMember.findOne({
      where: { trip_id, user_id: userId, status: 'accepted' }
    });

    if (!member) {
      return res.status(403).json({ success: false, message: "Bạn không phải là thành viên của chuyến đi này" });
    }

    const createdMemories = [];

    for (const file of files) {
      let final_media_type = media_type;
      if (!final_media_type) {
        final_media_type = file.mimetype.startsWith('video') ? 'video' : 'image';
      }

      if (!['image', 'video'].includes(final_media_type)) {
        continue;
      }

      const memory = await Memorie.create({
        trip_id,
        uploaded_by_id: userId,
        media_url: file.path,
        media_type: final_media_type,
        caption: caption || null,
        taken_at: taken_at || new Date(),
      });

      const populatedMemory = await Memorie.findByPk(memory.id, {
        include: [
          {
            model: User,
          as: "uploader",
          attributes: ["full_name", "avatar"],
        },
        ],
      });

      createdMemories.push(populatedMemory);
    }

    if (createdMemories.length > 0) {
      const uploaderName = createdMemories[0].uploader.full_name;
      
      const allMembers = await TripMember.findAll({
        where: { trip_id, status: 'accepted' }
      });

      for (const mem of allMembers) {
        if (mem.user_id !== userId) {
          try {
            const notification = await Notification.create({
              user_id: mem.user_id,
              type: "new_memory",
              title: "Upload ảnh chuyến đi",
              body: `${uploaderName} đã thêm ${createdMemories.length} ảnh/video mới vào chuyến đi "${trip.title}"`,
              metadata: {
                tripId: trip.id,
                senderId: userId,
                senderName: uploaderName,
                title: trip.title
              }
            });
            emitToUser(mem.user_id, "newNotification", notification);
          } catch (notifErr) {
            console.error("Lỗi khi tạo thông báo tải lên kỷ niệm:", notifErr);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Tải lên kỷ niệm thành công",
      data: createdMemories,
    });
  } catch (error) {
    console.error("Error in uploadMemorie:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message,
    });
  }
};

// Delete memories
exports.deleteMemorie = async (req, res) => {
  try {
    const { memory_id } = req.params;
    const userId = req.user.id;

    const memory = await Memorie.findByPk(memory_id, {
      include: [
        {
          model: Trip,
          attributes: ["id", "lead_id"]
        }
      ]
    });

    if (!memory) {
      return res.status(404).json({ success: false, message: "Không tìm thấy kỷ niệm" });
    }

    const trip = memory.Trip;

    if (trip.lead_id !== userId && memory.uploaded_by_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền xóa kỷ niệm này. Chỉ người tải lên hoặc trưởng nhóm mới có thể xóa." 
      });
    }

    if (memory.media_url) {
      const urlMatches = memory.media_url.match(/\/v\d+\/(.+)\.\w+$/) || memory.media_url.match(/\/upload\/(.+)\.\w+$/);
      if (urlMatches && urlMatches[1]) {
        const publicId = urlMatches[1];
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: memory.media_type === 'video' ? 'video' : 'image' });
        } catch (cloudErr) {
          console.error("Lỗi khi xóa ảnh/video trên Cloudinary:", cloudErr);
        }
      }
    }

    await memory.destroy();

    res.status(200).json({
      success: true,
      message: "Xóa kỷ niệm thành công",
    });
  } catch (error) {
    console.error("Error in deleteMemorie:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message,
    });
  }
};

// Lấy tất cả ảnh/video theo tất cả các ngày/từng ngày của chuyến đi
exports.getGroupedMemoriesByTrip = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findByPk(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chuyến đi" });
    }

    const member = await TripMember.findOne({
      where: { trip_id, user_id: userId, status: 'accepted' }
    });

    if (!member) {
      return res.status(403).json({ success: false, message: "Bạn không phải là thành viên của chuyến đi này" });
    }

    const memories = await Memorie.findAll({
      where: { trip_id },
      include: [
        {
          model: User,
          as: "uploader",
          attributes: ["full_name", "avatar"],
        },
      ],
      order: [["taken_at", "ASC"], ["created_at", "ASC"]],
    });

    
    const startDateObj = new Date(trip.start_date);
    startDateObj.setHours(0, 0, 0, 0);

    const grouped = {};
    memories.forEach(mem => {
      const dateObj = mem.taken_at || mem.created_at;
      const memDateObj = new Date(dateObj);
      const dateStr = memDateObj.toISOString().split('T')[0];

      if (!grouped[dateStr]) {
        const compareDateObj = new Date(dateStr);
        compareDateObj.setHours(0, 0, 0, 0);
        
        const diffTime = compareDateObj.getTime() - startDateObj.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const dayNumber = diffDays >= 0 ? diffDays + 1 : diffDays;

        grouped[dateStr] = {
          date: dateStr,
          day_number: dayNumber,
          count: 0,
          memories: []
        };
      }
      grouped[dateStr].memories.push(mem);
      grouped[dateStr].count += 1;
    });

    const groupedArray = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      message: "Lấy danh sách kỷ niệm theo nhóm thành công",
      data: groupedArray,
    });
  } catch (error) {
    console.error("Error in getGroupedMemoriesByTrip:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message,
    });
  }
};

// Lấy thông tin chuyến đi
exports.getMemorieTripInfo = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findByPk(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Không tìm thấy chuyến đi" });
    }

    const member = await TripMember.findOne({
      where: { trip_id, user_id: userId, status: 'accepted' }
    });

    if (!member) {
      return res.status(403).json({ success: false, message: "Bạn không phải là thành viên của chuyến đi này" });
    }

    const actualMemberCount = await TripMember.count({
      where: { trip_id, status: 'accepted' }
    });

    const totalMemories = await Memorie.count({
      where: { trip_id }
    });

    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const uploaderMemories = await Memorie.findAll({
      where: { trip_id },
      attributes: ['uploaded_by_id'],
    });
    const uploaderIds = [...new Set(uploaderMemories.map(m => m.uploaded_by_id))];
    const uploaders = await User.findAll({
      where: { id: uploaderIds },
      attributes: ["id", "full_name", "avatar"],
    });

    res.status(200).json({
      success: true,
      message: "Lấy thông tin chuyến đi thành công",
      data: {
        title: trip.title,
        start_date: trip.start_date,
        end_date: trip.end_date,
        total_days: daysCount > 0 ? daysCount : 1,
        total_members: actualMemberCount,
        total_memories: totalMemories,
        uploaders: uploaders,
      }
    });
  } catch (error) {
    console.error("Error in getMemorieTripInfo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
      error: error.message,
    });
  }
};
