const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Login/Register user
router.post('/login', verifyToken, async (req, res) => {
  try {
    const { uid, email, displayName } = req.user;

    // First, try to find user by firebaseUid or email
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: email }]
    });

    if (user) {
      // Update existing user
      user.firebaseUid = uid;
      user.email = email;
      user.displayName = displayName;
      await user.save();
    } else {
      // Create new user
      user = new User({
        firebaseUid: uid,
        email,
        displayName,
        progression: []
      });
      await user.save();
    }

    res.json({
      id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset all progress
router.delete('/progress', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear all progression but keep the user account
    user.progression = [];
    await user.save();

    res.json({ success: true, message: 'All progress reset successfully' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const result = await User.findOneAndDelete({ firebaseUid: req.user.uid });
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

