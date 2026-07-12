const express = require('express');
const Profile = require('../models/Profile');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

// get / create-on-first-access my profile
router.get('/me', authenticate, async (req, res) => {
  let profile = await Profile.findOne({ userId: req.user.id });
  if (!profile) {
    profile = await Profile.create({ userId: req.user.id, email: req.user.email });
  }
  res.json({ profile });
});

router.put('/me', authenticate, async (req, res) => {
  const profile = await Profile.findOneAndUpdate(
    { userId: req.user.id },
    { $set: req.body },
    { new: true, upsert: true }
  );
  res.json({ profile });
});

router.post('/me/addresses', authenticate, async (req, res) => {
  const profile = await Profile.findOneAndUpdate(
    { userId: req.user.id },
    { $push: { addresses: req.body } },
    { new: true, upsert: true }
  );
  res.status(201).json({ profile });
});

module.exports = router;
