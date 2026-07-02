const express = require('express');
const router = express.Router();
const { 
    uploadMemories,
    deleteMemorie,
    getGroupedMemoriesByTrip,
    getMemorieTripInfo
} = require('../controllers/memorieController');

const authMiddleware = require('../middlewares/authMiddleware');
const { uploadMemorie } = require('../configs/cloudinary');

router.use(authMiddleware);

router.post('/', uploadMemorie.array("media", 10), uploadMemories);
router.delete('/:memory_id', deleteMemorie);
router.get('/trip/:trip_id/grouped', getGroupedMemoriesByTrip);
router.get('/info/:trip_id', getMemorieTripInfo);

module.exports = router;
