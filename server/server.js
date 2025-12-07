require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  try {
    await client.connect();
    db = client.db('quiz-questions');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Routes

// Get all topics with question counts
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await db.collection('allQuestions').find({}).toArray();
    const topicsWithCounts = topics.map(topic => ({
      _id: topic._id,
      topic: topic.topic,
      questionCount: topic.questions ? topic.questions.length : 0
    }));
    res.json(topicsWithCounts);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get topic by ID with all questions
app.get('/api/topics/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await db.collection('allQuestions').findOne({ _id: new ObjectId(topicId) });
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// Helper: shuffle array and take n items
function shuffleAndTake(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Generate quiz - get 5 random questions based on mode
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topicId, mode, firebaseUid } = req.body;
    
    // Get user progression first
    const user = await db.collection('users').findOne({ firebaseUid });
    const userProgression = user?.progression?.find(p => p.topicId.toString() === topicId) || {
      masteredQuestions: [],
      mistakeQuestions: []
    };

    let quizQuestions = [];
    let totalAvailable = 0;
    let topicName = '';

    if (mode === 'mistakes' || mode === 'mastered') {
      // For mistakes/mastered: pick 5 random IDs first, then query only those
      const questionIds = mode === 'mistakes' 
        ? userProgression.mistakeQuestions 
        : userProgression.masteredQuestions;
      
      totalAvailable = questionIds.length;
      const selectedIds = shuffleAndTake(questionIds, 5);

      if (selectedIds.length > 0) {
        // Single aggregation query to get only the selected questions
        const result = await db.collection('allQuestions').aggregate([
          { $match: { _id: new ObjectId(topicId) } },
          { $project: {
            topic: 1,
            questions: {
              $filter: {
                input: '$questions',
                as: 'q',
                cond: { $in: ['$$q.id', selectedIds] }
              }
            }
          }}
        ]).toArray();

        if (result.length > 0) {
          topicName = result[0].topic;
          quizQuestions = result[0].questions || [];
        }
      } else {
        // No questions available, just get topic name
        const topic = await db.collection('allQuestions').findOne(
          { _id: new ObjectId(topicId) },
          { projection: { topic: 1 } }
        );
        topicName = topic?.topic || '';
      }
    } else {
      // For remaining: need to filter out mastered and mistakes
      const excludeIds = [
        ...userProgression.masteredQuestions,
        ...userProgression.mistakeQuestions
      ];

      // Use aggregation to filter and sample in one query
      const result = await db.collection('allQuestions').aggregate([
        { $match: { _id: new ObjectId(topicId) } },
        { $project: {
          topic: 1,
          questions: {
            $filter: {
              input: '$questions',
              as: 'q',
              cond: { $not: { $in: ['$$q.id', excludeIds] } }
            }
          }
        }}
      ]).toArray();

      if (result.length > 0) {
        topicName = result[0].topic;
        const availableQuestions = result[0].questions || [];
        totalAvailable = availableQuestions.length;
        quizQuestions = shuffleAndTake(availableQuestions, 5);
      }
    }

    if (!topicName) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({
      topicId,
      topicName,
      mode,
      questions: quizQuestions,
      totalAvailable
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit quiz results and update progression
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const { firebaseUid, topicId, mode, results } = req.body;
    // results = [{ questionId, isCorrect }]

    const user = await db.collection('users').findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find or create progression for this topic
    let progression = user.progression || [];
    let topicProgressionIndex = progression.findIndex(p => p.topicId.toString() === topicId);
    
    if (topicProgressionIndex === -1) {
      progression.push({
        topicId: new ObjectId(topicId),
        masteredQuestions: [],
        mistakeQuestions: []
      });
      topicProgressionIndex = progression.length - 1;
    }

    const topicProgression = progression[topicProgressionIndex];

    // Process each result based on mode
    for (const result of results) {
      const { questionId, isCorrect } = result;

      if (mode === 'remaining') {
        if (isCorrect) {
          // Move to mastered
          if (!topicProgression.masteredQuestions.includes(questionId)) {
            topicProgression.masteredQuestions.push(questionId);
          }
        } else {
          // Move to mistakes
          if (!topicProgression.mistakeQuestions.includes(questionId)) {
            topicProgression.mistakeQuestions.push(questionId);
          }
        }
      } else if (mode === 'mistakes') {
        if (isCorrect) {
          // Remove from mistakes (goes back to remaining)
          topicProgression.mistakeQuestions = topicProgression.mistakeQuestions.filter(id => id !== questionId);
        }
        // If incorrect, stays in mistakes
      } else if (mode === 'mastered') {
        if (!isCorrect) {
          // Remove from mastered (goes back to remaining)
          topicProgression.masteredQuestions = topicProgression.masteredQuestions.filter(id => id !== questionId);
        }
        // If correct, stays in mastered
      }
    }

    progression[topicProgressionIndex] = topicProgression;

    // Update user in database
    await db.collection('users').updateOne(
      { firebaseUid },
      { $set: { progression } }
    );

    res.json({ success: true, progression: topicProgression });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get or create user
app.post('/api/users', async (req, res) => {
  try {
    const { firebaseUid, email, displayName, photoURL } = req.body;
    
    let user = await db.collection('users').findOne({ firebaseUid });
    
    if (!user) {
      // Create new user
      const newUser = {
        firebaseUid,
        email,
        displayName,
        photoURL,
        progression: [],
        createdAt: new Date()
      };
      await db.collection('users').insertOne(newUser);
      user = newUser;
    } else {
      // Update user info
      await db.collection('users').updateOne(
        { firebaseUid },
        { $set: { email, displayName, photoURL } }
      );
      user = { ...user, email, displayName, photoURL };
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error with user:', error);
    res.status(500).json({ error: 'Failed to process user' });
  }
});

// Get user progress for a specific topic
app.get('/api/users/:firebaseUid/progress/:topicId', async (req, res) => {
  try {
    const { firebaseUid, topicId } = req.params;
    
    const user = await db.collection('users').findOne({ firebaseUid });
    if (!user) {
      return res.json({ masteredQuestions: [], mistakeQuestions: [] });
    }

    const found = user.progression?.find(p => p.topicId.toString() === topicId);
    const topicProgression = {
      masteredQuestions: found?.masteredQuestions || [],
      mistakeQuestions: found?.mistakeQuestions || []
    };

    // Get total questions for the topic
    const topic = await db.collection('allQuestions').findOne({ _id: new ObjectId(topicId) });
    const totalQuestions = topic?.questions?.length || 0;

    res.json({
      ...topicProgression,
      totalQuestions,
      remainingCount: totalQuestions - topicProgression.masteredQuestions.length - topicProgression.mistakeQuestions.length
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get user's overall stats
app.get('/api/users/:firebaseUid/stats', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    const user = await db.collection('users').findOne({ firebaseUid });
    if (!user) {
      return res.json({ totalMastered: 0, totalMistakes: 0, topicsStarted: 0 });
    }

    const progression = user.progression || [];
    const stats = {
      totalMastered: progression.reduce((sum, p) => sum + (p.masteredQuestions?.length || 0), 0),
      totalMistakes: progression.reduce((sum, p) => sum + (p.mistakeQuestions?.length || 0), 0),
      topicsStarted: progression.length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

