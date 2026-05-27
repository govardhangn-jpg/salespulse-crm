const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ─── Verify JWT and attach user to request ─────────────
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    if (!token)
      return res.status(401).json({ status: 'fail', message: 'Not authenticated. Please log in.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);

    if (!user || !user.isActive)
      return res.status(401).json({ status: 'fail', message: 'User no longer exists or is inactive.' });

    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat))
      return res.status(401).json({ status: 'fail', message: 'Password recently changed. Please log in again.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError')
      return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ status: 'fail', message: 'Token expired. Please log in again.' });
    next(err);
  }
};

// ─── Role-based access control ──────────────────────────
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      status:  'fail',
      message: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  next();
};

// ─── State-based visibility filter ─────────────────────
// FIXED: Never block a user — if no states assigned, show no state filter
// The customer $or filter (assignedTo/submittedBy) still lets them see their own customers
exports.applyStateFilter = (req, res, next) => {
  if (req.user.role === 'admin') {
    req.stateFilter = {}; // Admins see everything
  } else if (!req.user.assignedStates || req.user.assignedStates.length === 0) {
    req.stateFilter = {}; // No state restriction — they'll see own customers via $or filter
  } else {
    req.stateFilter = { 'address.state': { $in: req.user.assignedStates } };
  }
  next();
};
