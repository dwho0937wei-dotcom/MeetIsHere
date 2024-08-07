// backend/routes/api/session.js
const express = require('express');
const bcrypt = require('bcryptjs');

const { User } = require('../../db/models');
const { setTokenCookie, userLoggedIn } = require('../../utils/auth');
const { getUserFromToken } = require('../../utils/helper');
const { validateLogin } = require('../../utils/validation');

const router = express.Router();

// Get the current user
router.get('/', async (req, res) => {
    res.status(200);
    if (!userLoggedIn(req)) {
        return res.json({
            user: null
        })
    }

    const user = getUserFromToken(req);
    return res.json({ user });
})

// Login user
router.post('/', validateLogin, async (req, res) => {
    const { credential, password } = req.body;

    // Find email or username
    let user = await User.findOne({
        where: {
            email: credential
        }
    });
    if (!user) {
        user = await User.findOne({
            where: {
                username: credential
            }
        })
    }

    // Check the password
    if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
        res.status(401);
        return res.json({
            message: "Invalid credentials"
        })
    }

    const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username
    };

    await setTokenCookie(res, safeUser);

    res.status(200);
    return res.json({
        user: safeUser
    });
})

// Log out
router.delete(
    '/',
    (_req, res) => {
        res.clearCookie('token');
        return res.json({ message: 'success' });
    }
);

module.exports = router;