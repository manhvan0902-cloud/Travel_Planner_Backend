const express = require("express");
const {
  getMembers,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  removeMember,
} = require("../controllers/memberTripController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.use(authMiddleware);

router.get("/:trip_id", getMembers);
router.post("/:trip_id/invite", inviteMember);
router.put("/:trip_id/accept", acceptInvitation);
router.put("/:trip_id/reject", rejectInvitation);
router.delete("/:trip_id/:user_id/remove", removeMember);

module.exports = router;
