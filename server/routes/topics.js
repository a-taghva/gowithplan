const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Get all topics with user's progress counts
router.get('/', verifyToken, async (req, res) => {
  try {
    const topics = await Topic.find();
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
      // Get total questions for this topic
      const totalQuestions = await Question.countDocuments({ topicId: topic.topicId });
      
      // Get user's progression for this topic
      const userProgress = user?.progression?.find(
        p => p.topicId.toString() === topic._id.toString()
      );

      let remaining = totalQuestions;
      let mistakes = 0;
      let mastered = 0;
      let favorites = [];

      if (userProgress) {
        const answeredQuestions = userProgress.answeredQuestions || [];
        mistakes = answeredQuestions.filter(q => !q.isCorrect).length;
        mastered = answeredQuestions.filter(q => q.isCorrect).length;
        remaining = totalQuestions - answeredQuestions.length;
        favorites = userProgress.favoriteQuestions || [];
      }

      return {
        _id: topic._id,
        topicId: topic.topicId,
        topic: topic.topic,
        totalQuestions,
        remaining,
        mistakes,
        mastered,
        favoriteCount: favorites.length
      };
    }));

    res.json(topicsWithCounts);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset progress for a topic
router.delete('/:topicId/progress', verifyToken, async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findOne({ topicId });
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find and reset progression for this topic
    const progressionIndex = user.progression.findIndex(
      p => p.topicId.toString() === topic._id.toString()
    );

    if (progressionIndex !== -1) {
      // Clear answered questions but keep favorites
      user.progression[progressionIndex].answeredQuestions = [];
      await user.save();
    }

    res.json({ success: true, message: 'Progress reset successfully' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear all favorites for a topic
router.delete('/:topicId/favorites', verifyToken, async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findOne({ topicId });
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progressionIndex = user.progression.findIndex(
      p => p.topicId.toString() === topic._id.toString()
    );

    if (progressionIndex !== -1) {
      user.progression[progressionIndex].favoriteQuestions = [];
      await user.save();
    }

    res.json({ success: true, message: 'All favorites cleared' });
  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get favorites for a topic
router.get('/:topicId/favorites', verifyToken, async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findOne({ topicId });
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    const userProgress = user?.progression?.find(
      p => p.topicId.toString() === topic._id.toString()
    );

    const favoriteIds = userProgress?.favoriteQuestions || [];
    
    if (favoriteIds.length === 0) {
      return res.json([]);
    }

    const questions = await Question.find({
      topicId,
      questionId: { $in: favoriteIds }
    });

    res.json(questions);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

