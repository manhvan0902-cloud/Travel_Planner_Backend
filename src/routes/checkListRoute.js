const express = require("express");
const router = express.Router();

const { 
    createCheckListGroup, 
    createChecklistItem,
    getChecklistItems,
    deleteChecklistItem,
    updateChecklistItem
} = require("../controllers/checkListController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");


router.use(authMiddleware);

router.post("/group", createCheckListGroup);
router.post("/item", createChecklistItem);
router.get("/trip/:trip_id", getChecklistItems);
router.delete("/item/:item_id", deleteChecklistItem);
router.put("/item/:item_id", updateChecklistItem);

module.exports = router;