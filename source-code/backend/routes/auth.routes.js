const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, changePassword,
  refreshToken, updateNotifications, getAuditLogs
} = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/register',      register);
router.post('/login',         login);
router.post('/logout',        logout);
router.post('/refresh',       refreshToken);
router.get( '/me',            authMiddleware, getMe);
router.put( '/change-password', authMiddleware, changePassword);
router.put( '/notifications', authMiddleware, updateNotifications);
router.get( '/audit-logs',    authMiddleware, getAuditLogs);

module.exports = router;
