const mongoose = require('mongoose');

const answeredQuestionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
}, { _id: false });

const progressionSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answeredQuestions: {
    type: [answeredQuestionSchema],
    default: []
  },
  favoriteQuestions: {
    type: [String],
    default: []
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    default: ''
  },
  progression: {
    type: [progressionSchema],
    default: []
  }
});

module.exports = mongoose.model('User', userSchema, 'users');

