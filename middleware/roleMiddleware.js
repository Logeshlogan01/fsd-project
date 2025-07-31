// middleware/roleMiddleware.js
function ensureAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
      next();
  } else {
      res.redirect('/index.html'); // redirect non-admin users
  }
}
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth.html');
}

function permit(...allowedRoles) { // ✅ renamed from checkRole to permit
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).send('Unauthorized: Please log in.');
    }

    const userRole = req.session.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).send('Forbidden: You do not have access.');
    }

    next();
  };
}

module.exports = {
  ensureAuthenticated,
  permit // ✅ export as permit
};
// check roless
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth.html');
    }

    const userRole = req.session.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).send('Access Denied');
    }

    next();
  };
}

function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/auth.html');
  }
}

module.exports = { checkRole, ensureAuthenticated };

