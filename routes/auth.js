const express = require('express');
const router = express.Router();
const User = require('../models/User');


router.post('/api/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  const existing = await User.findOne({ username });
  if (existing) return res.json({ success: false, message: 'Username already exists' });

  const newUser = new User({ username, email, password, role });
  await newUser.save();

  res.json({ success: true });
});

router.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (!user) return res.json({ success: false, message: 'Invalid credentials' });

  req.session.user = {
    username: user.username,
    role: user.role
  };

  res.json({ success: true });
});
//signup --  function
router.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;
  console.log("📥 Signup request received:", req.body);

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      let message = 'Username or Email already exists';
      if (existingUser.username === username) message = 'Username already exists';
      if (existingUser.email === email) message = 'Email already exists';
      return res.json({ success: false, message });
    }

    const newUser = new User({ username, email, password, role });
    await newUser.save();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Signup failed:", err);
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
});

//login--function
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    req.session.user = {
      username: user.username,
      role: user.role,
    };

    return res.json({ success: true, role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

