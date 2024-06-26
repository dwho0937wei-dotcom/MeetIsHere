// backend/utils/auth.js
const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config');
// const { User } = require('../db/models');

const { secret, expiresIn } = jwtConfig;

// Sends a JWT Cookie
const setTokenCookie = (res, user) => {
    // Create the token.
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };
    const token = jwt.sign(
      { data: safeUser },
      secret,
      { expiresIn: parseInt(expiresIn) } // 604,800 seconds = 1 week
    );
  
    const isProduction = process.env.NODE_ENV === "production";
  
    // Set the token cookie
    res.cookie('token', token, {
      maxAge: expiresIn * 1000, // maxAge in milliseconds
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction && "Lax"
    });
  
    return token;
  };

const restoreUser = (req, res, next) => {
    // token parsed from cookies
    const { token } = req.cookies;
    req.user = null;
  
    return jwt.verify(token, secret, null, async (err, jwtPayload) => {
      if (err) {
        return next();
      }
  
      try {
        const { id } = jwtPayload.data;
        req.user = await User.findByPk(id, {
          attributes: {
            include: ['email', 'createdAt', 'updatedAt']
          }
        });
      } catch (e) {
        res.clearCookie('token');
        return next();
      }
  
      if (!req.user) res.clearCookie('token');
  
      return next();
    });
  };

// If there is no current user, return an error
const requireAuth = function (req, _res, next) {
    if (req.user) return next();
  
    const err = new Error('Authentication required');
    err.title = 'Authentication required';
    err.errors = { message: 'Authentication required' };
    err.status = 401;
    return next(err);
  }

// --------------------------------------------------------------- Authentications --------------------------------------------------------------------

// If the user is logged in, return true
const userLoggedIn = function (req) {
  const { token } = req.cookies;
  let loggedIn = false;
  if (token) {
    loggedIn = jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (!err) {
        return true;
      }
    })
  }
  return loggedIn;
};

// Error Response: Require Authentication
const requireAuth2 = function (res) {
  res.status(401);
  return res.json({
    message: "Authentication required"
  });
};

// --------------------------------------------------------------- Authorizations --------------------------------------------------------------------

const requireProperAuth = function (res) {
  res.status(403);
  return res.json({
    message: "Forbidden"
  });
};

module.exports = { setTokenCookie, 
                   restoreUser, 
                   requireAuth, 
                   userLoggedIn, 
                   requireAuth2, 
                   requireProperAuth 
                 };