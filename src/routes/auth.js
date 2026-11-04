const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserStorage = require('../utils/userStorage');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

let users = UserStorage.loadUsers();

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (UserStorage.findUserByUsername(users, username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    if (UserStorage.findUserByEmail(users, email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const newUser = await User.create(username, email, password);
    users.push(newUser);
    UserStorage.saveUsers(users);

    const accessToken = generateAccessToken(newUser.id, newUser.username);
    const refreshToken = generateRefreshToken(newUser.id, newUser.username);

    res.status(201).json({
      user: newUser.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = UserStorage.findUserByUsername(users, username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = generateRefreshToken(user.id, user.username);

    res.json({
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh', authLimiter, (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const user = UserStorage.findUserById(users, decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user.id, user.username);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
