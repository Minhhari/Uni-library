const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getSettings, upsertSetting, getAdminStats } = require('../controllers/systemSettingController');

const router = express.Router();

router.use(protect);

// GET  /admin/settings     – list all settings (admin only)
router.get('/settings', authorize('admin'), getSettings);

// PUT  /admin/settings/:key – update a setting value (admin only)
router.put('/settings/:key', authorize('admin'), upsertSetting);

// GET  /admin/stats         – system-wide analytics (admin only)
router.get('/stats', authorize('admin'), getAdminStats);

module.exports = router;
