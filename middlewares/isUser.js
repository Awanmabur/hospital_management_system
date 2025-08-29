const jwt = require('jsonwebtoken');

exports.isUser = (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    req.flash('error', 'Please login to access this page.');
    return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      req.flash('error', 'Session expired or invalid. Please login again.');
      return res.redirect('/login');
    }

    // Check for user role
    if (!['user', 'vendor', 'promoter', 'organizer'].includes(decodedToken.role)) {
      req.flash('warning', 'Dear user, please do the right thing, or you will be suspended.');
      return res.redirect('/login');
    }

    // Pass user info to request object if needed
    req.user = decodedToken;
    next();
  });
};
