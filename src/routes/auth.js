const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserStorage = require('../utils/userStorage');
const { generateToken } = require('../middleware/auth');
const { validateEmail, validatePassword } = require('../middleware/validation');

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    const users = UserStorage.loadUsers();
    if (UserStorage.findUserByEmail(email, users)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await User.hashPassword(password);
    const newUser = new User(Date.now().toString(), email, passwordHash);
    users.push(newUser);
    UserStorage.saveUsers(users);

    const token = generateToken(newUser.id, newUser.email);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = UserStorage.loadUsers();
    const user = UserStorage.findUserByEmail(email, users);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await user.verifyPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email);
    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
