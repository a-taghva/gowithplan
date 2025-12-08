const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Get questions for a quiz
// mode: 'remaining', 'mistakes', 'mastered'
router.get('/:topicId/:mode', verifyToken, async (req, res) => {
  try {
    const { topicId, mode } = req.params;
    const topic = await Topic.findOne({ topicId });
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    const userProgress = user?.progression?.find(
      p => p.topicId.toString() === topic._id.toString()
    );

    const answeredQuestions = userProgress?.answeredQuestions || [];
    const answeredIds = answeredQuestions.map(q => q.questionId);
    const mistakeIds = answeredQuestions.filter(q => !q.isCorrect).map(q => q.questionId);
    const masteredIds = answeredQuestions.filter(q => q.isCorrect).map(q => q.questionId);

    let query = { topicId };
    let questions;

    if (mode === 'remaining') {
      // Questions not yet answered
      if (answeredIds.length > 0) {
        query.questionId = { $nin: answeredIds };
      }
      questions = await Question.find(query);
    } else if (mode === 'mistakes') {
      // Questions answered incorrectly
      if (mistakeIds.length === 0) {
        return res.json([]);
      }
      query.questionId = { $in: mistakeIds };
      questions = await Question.find(query);
    } else if (mode === 'mastered') {
      // Questions answered correctly
      if (masteredIds.length === 0) {
        return res.json([]);
      }
      query.questionId = { $in: masteredIds };
      questions = await Question.find(query);
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    // Shuffle and take up to 5 questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    res.json(selected);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit quiz results
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const { topicId, mode, results } = req.body;
    // results: [{ questionId, isCorrect }]

    const topic = await Topic.findOne({ topicId });
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find or create progression for this topic
    let progressionIndex = user.progression.findIndex(
      p => p.topicId.toString() === topic._id.toString()
    );

    if (progressionIndex === -1) {
      user.progression.push({
        topicId: topic._id,
        answeredQuestions: [],
        favoriteQuestions: []
      });
      progressionIndex = user.progression.length - 1;
    }

    const progression = user.progression[progressionIndex];

    for (const result of results) {
      const { questionId, isCorrect } = result;
      
      // Find existing answer if any
      const existingIndex = progression.answeredQuestions.findIndex(
        q => q.questionId === questionId
      );

      if (mode === 'remaining') {
        // Add new answer
        if (existingIndex === -1) {
          progression.answeredQuestions.push({ questionId, isCorrect });
        }
      } else if (mode === 'mistakes') {
        // If answered correctly from mistakes, remove from progression (back to remaining)
        if (isCorrect && existingIndex !== -1) {
          progression.answeredQuestions.splice(existingIndex, 1);
        }
        // If still incorrect, keep as mistake (no change needed)
      } else if (mode === 'mastered') {
        // If answered incorrectly from mastered, remove from progression (back to remaining)
        if (!isCorrect && existingIndex !== -1) {
          progression.answeredQuestions.splice(existingIndex, 1);
        }
        // If still correct, keep as mastered (no change needed)
      }
    }

    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle favorite
router.post('/favorite', verifyToken, async (req, res) => {
  try {
    const { topicId, questionId } = req.body;

    const topic = await Topic.findOne({ topicId });
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find or create progression for this topic
    let progressionIndex = user.progression.findIndex(
      p => p.topicId.toString() === topic._id.toString()
    );

    if (progressionIndex === -1) {
      user.progression.push({
        topicId: topic._id,
        answeredQuestions: [],
        favoriteQuestions: []
      });
      progressionIndex = user.progression.length - 1;
    }

    const progression = user.progression[progressionIndex];
    const favoriteIndex = progression.favoriteQuestions.indexOf(questionId);

    if (favoriteIndex === -1) {
      progression.favoriteQuestions.push(questionId);
    } else {
      progression.favoriteQuestions.splice(favoriteIndex, 1);
    }

    await user.save();

    res.json({ 
      success: true, 
      isFavorite: favoriteIndex === -1 
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

