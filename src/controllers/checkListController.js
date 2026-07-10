const { Trip, User, CheckList_group, CheckList_item } = require("../models/index.js");

// Tạo nhóm đồ mới
exports.createCheckListGroup = async (req, res) => {
    try{
        const { trip_id, category } = req.body;
        
        console.log( trip_id, category);
        if( !trip_id || !category ) {
            return res.status(400).json({
                success: false,
                message: " trip_id hoặc category không được để null"
            });
        }

        const trip = await Trip.findByPk(trip_id);
        if (!trip) {
            return res.status(400).json({
                success: false,
                message: "Không có trip",
            });
        }

        const existingGroup = await CheckList_group.findOne({
            where: { trip_id, category }
        });

        if (existingGroup) {
            return res.status(400).json({
                success: false,
                message: "Nhóm đồ này đã được tạo",
            });
        }
        
        const checklistGroup = await CheckList_group.create({
            trip_id, category
        });
        

        return res.status(200).json({
            success: true,
            message: "Tạo nhóm đồ mới thành công",
            data: checklistGroup
        });
    }
    catch(err){
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống",
            error: err.message,
        });
    }
}


//Thêm đồ vào nhóm
exports.createChecklistItem = async (req, res) => {
    try {
        const { trip_id, group_id, title, assigned_to, due_date } = req.body;
        const created_by_id = req.user.id;

        if (!trip_id || !group_id || !title) {
            return res.status(400).json({
                success: false,
                message: "trip_id, group_id và title không được để trống"
            });
        }

        const group = await CheckList_group.findByPk(group_id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nhóm đồ"
            });
        }

        const existingItem = await CheckList_item.findOne({
            where: { trip_id, group_id, title }
        });
        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: "Đồ này đã được tạo",
            });
        }

        const checklistItem = await CheckList_item.create({
            trip_id,
            group_id,
            title,
            assigned_to: assigned_to || null,
            due_date: due_date || null,
            created_by_id
        });

        return res.status(201).json({
            success: true,
            message: "Thêm đồ mới thành công",
            data: checklistItem
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống",
            error: err.message,
        });
    }
};

//Lấy danh sách đồ
exports.getChecklistItems = async (req, res) => {
    try {
        const { trip_id } = req.params;

        if(!trip_id) {
            return res.status(400).json({
                success: false,
                message: "trip_id không được để trống"
            });
        }

        const groups = await CheckList_group.findAll({
            where: { trip_id },
            attributes: {
                exclude: ['trip_id']
            },
            include: [
                {
                    model: CheckList_item,
                    as: 'items',
                    attributes: [
                        'id', 'title', 'is_completed', 'due_date', 'created_at'
                    ]
                }
            ],
            order: [
                ['created_at', 'ASC'],
                [{ model: CheckList_item, as: 'items' }, 'created_at', 'ASC']
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đồ thành công",
            data: groups
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống",
            error: err.message,
        });
    }
};

//Xóa đồ
exports.deleteChecklistItem = async (req, res) => {
    try {
        const { item_id } = req.params;
        
        if( !item_id){
            return res.status(400).json({
                success: false,
                message: "item_id không được để trống"
            });
        }

        const item = await CheckList_item.findByPk(item_id);
        if (!item) {
            return res.status(404).json({ success: false, message: "Không tìm thấy items" });
        }
        
        await item.destroy();
        
        return res.status(200).json({ success: true, message: "Xóa thành công" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi hệ thống", error: err.message });
    }
};

//Đánh dấu đã hoàn thành
exports.updateChecklistItem = async (req, res) => {
    try {
        const { item_id } = req.params;

        const item = await CheckList_item.findByPk(item_id);
        if (!item) {
            return res.status(404).json({ success: false, message: "Không tìm thấy item" });
        }

        item.is_completed = !item.is_completed;

        await item.save();

        return res.status(200).json({ 
            success: true, 
            message: "Cập nhật thành công", 
            data: {
                id: item.id,
                group_id: item.group_id,
                title: item.title,
                is_completed: item.is_completed
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi hệ thống", error: err.message });
    }
};

 