const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  monthlyCompare, forecast, savingStreak, topCategories, getCurrencies
} = require('../controllers/analytics.controller');

// Tất cả routes analytics đều cần xác thực
router.use(authMiddleware);

router.get('/monthly-compare', monthlyCompare);  // So sánh tháng
router.get('/forecast',        forecast);         // Dự báo chi tiêu
router.get('/streak',          savingStreak);     // Streak tiết kiệm
router.get('/top-categories',  topCategories);    // Top danh mục
router.get('/currencies',      getCurrencies);    // Danh sách tiền tệ

module.exports = router;
