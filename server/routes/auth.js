const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashed });
    await newUser.save();
    res.send({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).send({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).send({ message: 'Invalid credentials' });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });


    res.send({ token });
  } catch (err) {
    res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;
