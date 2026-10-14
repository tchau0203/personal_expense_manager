const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { getMonthlySummary, sendMonthlyReport } = require('../controllers/report.controller');

router.use(authMiddleware);
router.get('/monthly-summary', getMonthlySummary);
router.post('/send-monthly', sendMonthlyReport);

module.exports = router;
