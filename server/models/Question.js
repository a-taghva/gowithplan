const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  topicId: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  questionId: {
    type: String,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    default: []
  },
  answer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Question', questionSchema, 'questions');

