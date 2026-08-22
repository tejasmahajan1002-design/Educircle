const jwt = require('jsonwebtoken');
const db = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'campushare-super-secret-key-12345';

// Verify token middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Check if user still exists and is not blocked
    const user = db.users.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked by the Administrator.' });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

// Check if user is Admin middleware
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

module.exports = {
  authenticate,
  authorizeAdmin,
  JWT_SECRET
};
