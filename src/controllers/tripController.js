const { Trip, TripMember, User } = require("../models/index.js");
const { sequelize } = require("../configs/database.js");


exports.getMyTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const trips = await Trip.findAll({
      include: [
        {
          model: User,
          as: "participants",
          where: { id: userId },
          attributes: [],
          through: { attributes: [] },
        },
        {
          model: User,
          as: "lead",
          attributes: ["id", "full_name", "avatar"],
        },
      ],
      order: [["start_date", "ASC"]],
    });

    res.status(200).json({
      success: true,
      message: "Trip fetched successfully",
      data: trips,
    });
  } catch (error) {
    console.error("Error in getMyTrips:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message, 
    });
  }
};


exports.createTrip = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { title, start_date, end_date, member_count, total_budget, status } = req.body;
    const cover_image = req.file ? req.file.path : null;
    const userId = req.user.id;

    if (!title || !start_date || !end_date) {
      if (!t.finished) {
        await t.rollback();
      }
      return res.status(400).json({ 
        success: false, 
        message: "Title, start_date, and end_date are required",
      });
    }

    const trip = await Trip.create(
      {
        title,
        cover_image,
        start_date,
        end_date,
        member_count,
        total_budget,
        status: status || "upcoming",
        lead_id: userId,
      },
      { transaction: t }
    );

    await TripMember.create(
      {
        trip_id: trip.id,
        user_id: userId,
        role: "lead",
        status: "accepted",
        joined_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: trip,
    });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("Error in createTrip:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message, 
    });
  }
};


exports.getTripDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id, {
      include: [
        {
          model: User,
          as: "lead",
          attributes: ["id", "full_name", "email", "avatar"],
        },
        {
          model: User,
          as: "participants",
          attributes: ["id", "full_name", "email", "avatar"],
          through: {
            attributes: ["role", "status", "joined_at"],
          },
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Error in getTripDetails:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, start_date, end_date, total_budget, status, member_count } = req.body;
    const cover_image = req.file ? req.file.path : undefined;

    const trip = await Trip.findByPk(id);

    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: "Trip not found" 
      });
    }

    if (trip.lead_id !== userId) {
      return res.status(403).json({ success: false, message: "Only the trip lead can update the trip" });
    }

    await trip.update({
      title: title || trip.title,
      cover_image: cover_image !== undefined ? cover_image : trip.cover_image,
      start_date: start_date || trip.start_date,
      end_date: end_date || trip.end_date,
      total_budget: total_budget !== undefined ? total_budget : trip.total_budget,
      status: status || trip.status,
      member_count: member_count || trip.member_count,
    });

    res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error in updateTrip:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message,
    });
  }
};


exports.deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findByPk(id);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (trip.lead_id !== userId) {
      return res.status(403).json({ success: false, message: "Only the trip lead can delete the trip" });
    }
    await trip.destroy();

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteTrip:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message,
    });
  }
};

