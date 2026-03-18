const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Verify JWT and attach user to request ─────────────
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header OR cookie
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'Not authenticated. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user still exists
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ status: 'fail', message: 'User no longer exists or is inactive.' });
    }

    // Check if password changed after token issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ status: 'fail', message: 'Password recently changed. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'fail', message: 'Token expired. Please log in again.' });
    }
    next(err);
  }
};

// ─── Role-based access control ─────────────────────────
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// ─── State-based visibility filter ────────────────────
// Attaches a stateFilter to req for use in controllers.
// Admins see all states; sales reps only see their assigned states.
exports.applyStateFilter = (req, res, next) => {
  if (req.user.role === 'admin') {
    req.stateFilter = {}; // No restriction
  } else {
    if (!req.user.assignedStates || req.user.assignedStates.length === 0) {
      return res.status(403).json({
        status: 'fail',
        message: 'No states assigned to your account. Contact admin.',
      });
    }
    req.stateFilter = { 'address.state': { $in: req.user.assignedStates } };
  }
  next();
};
