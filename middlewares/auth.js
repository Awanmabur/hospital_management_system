const jwt = require('jsonwebtoken');

exports.isLoggedIn = (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    req.flash('error', 'Please login to continue.');
    return res.redirect('/login');
  }

  jwt.verify(token, 'jwtSecret', (err, decodedToken) => {
    if (err) {
      req.flash('error', 'Session expired or invalid. Please login again.');
      return res.redirect('/login');
    }

    req.user = decodedToken;
    next();
  });
};



exports.isAdmin = (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    req.flash('error', 'Please login to access this page.');
    return res.redirect('/login');
  }

  jwt.verify(token, 'jwtSecret', (err, decodedToken) => {
    if (err) {
      req.flash('error', 'Session expired or invalid. Please login again.');
      return res.redirect('/login');
    }

    // Check for super-admin role
    if (decodedToken.role !== 'super-admin') {
      req.flash('warning', 'Dear user, please do the right thing, or you will be suspended.');
      return res.redirect('/login');
    }

    // Pass user info to request object if needed
    req.user = decodedToken;
    next();
  });
};



exports.isUser = (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    req.flash('error', 'Please login to access this page.');
    return res.redirect('/login');
  }

  jwt.verify(token, 'jwtSecret', (err, decodedToken) => {
    if (err) {
      req.flash('error', 'Session expired or invalid. Please login again.');
      return res.redirect('/login');
    }

    // Check for user role
    if (!['doctor', 'pharmacist', 'nurse', 'accountant'].includes(decodedToken.role)) {
      req.flash('warning', 'Dear user, please do the right thing, or you will be suspended.');
      return res.redirect('/login');
    }

    // Pass user info to request object if needed
    req.user = decodedToken;
    next();
  });
};
