const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, changePassword } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   logout);
router.get( '/me',       authMiddleware, getMe);
router.put( '/change-password', authMiddleware, changePassword);

module.exports = router;
