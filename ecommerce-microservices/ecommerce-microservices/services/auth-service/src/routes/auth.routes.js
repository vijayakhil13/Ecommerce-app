const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../utils/jwt');

const router = express.Router();

// ---------- REGISTER ----------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      roles: roles && roles.length ? roles : ['customer'],
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, roles: user.roles },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// ---------- LOGIN (AUTHENTICATION) ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password || '', user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      user: { id: user._id, name: user.name, email: user.email, roles: user.roles },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// ---------- REFRESH TOKEN ----------
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });

    const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);
    if (!tokenExists) return res.status(401).json({ message: 'Refresh token revoked' });

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    // rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// ---------- LOGOUT ----------
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    await User.findByIdAndUpdate(decoded.sub, {
      $pull: { refreshTokens: { token: refreshToken } },
    });
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.json({ message: 'Logged out' }); // idempotent, token likely already invalid
  }
});

// ---------- VERIFY (AUTHORIZATION helper used by API gateway / other services) ----------
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ valid: false, message: 'No token provided' });

    const decoded = verifyAccessToken(token);
    res.json({ valid: true, user: { id: decoded.sub, email: decoded.email, roles: decoded.roles } });
  } catch (err) {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
