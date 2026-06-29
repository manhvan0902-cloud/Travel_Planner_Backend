const express = require("express");
const { getMyTrips, 
        createTrip, 
        getTripDetails, 
        updateTrip, 
        deleteTrip
} = require("../controllers/tripController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { uploadTripCover } = require("../configs/cloudinary.js");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMyTrips);
router.post("/", uploadTripCover.single("cover_image"), createTrip);
router.get("/:id", getTripDetails);
router.put("/:id", uploadTripCover.single("cover_image"), updateTrip);
router.delete("/:id", deleteTrip);

module.exports = router;
