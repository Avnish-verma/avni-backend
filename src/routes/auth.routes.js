const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: { message: 'Password is required' } });
    }

    // Compare the provided password with the hash in your .env
    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Incorrect password' } });
    }

    // If it matches, sign a token that lasts for 30 days
    const token = jwt.sign({ role: 'owner' }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ token, expiresIn: '30d' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

module.exports = router;