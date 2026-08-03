const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET || 'expense_manager_secret';
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Không có token xác thực. Vui lòng đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    return res.status(401).json({ error: 'Token không hợp lệ.' });
  }
}

module.exports = { authMiddleware };
