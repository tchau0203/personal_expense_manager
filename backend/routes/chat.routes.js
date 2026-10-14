const express = require('express');
const router  = express.Router();
const { chat } = require('../controllers/chat.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.post('/', chat);

module.exports = router;
