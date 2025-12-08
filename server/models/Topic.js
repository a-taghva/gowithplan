const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  topicId: {
    type: String,
    required: true,
    unique: true
  },
  topic: {
    type: String,
    required: true
  },
  questionCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Topic', topicSchema, 'topics');

