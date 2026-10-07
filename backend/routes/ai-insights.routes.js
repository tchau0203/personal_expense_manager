const express = require('express');
const router  = express.Router();
const { getInsightTips, autoCategorize, getSpendingTrends, getInsightSummary } = require('../controllers/ai-insights.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/tips',            getInsightTips);
router.get('/auto-categorize', autoCategorize);
router.get('/trends',          getSpendingTrends);
router.get('/summary',         getInsightSummary);

module.exports = router;
