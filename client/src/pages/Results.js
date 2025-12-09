import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import './Results.css';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const { results = [], questions = [], topicId, topicName, mode, favorites: initialFavorites = [] } = location.state || {};
  const [favorites, setFavorites] = useState(new Set(initialFavorites));

  if (!location.state) {
    navigate('/');
    return null;
  }

  const correctCount = results.filter(r => r.isCorrect).length;
  const incorrectCount = results.filter(r => !r.isCorrect).length;
  const totalAnswered = results.length;
  const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const toggleFavorite = async (questionId) => {
    try {
      const token = await getToken();
      await axios.post('/api/quiz/favorite', {
        topicId,
        questionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(questionId)) {
          newFavorites.delete(questionId);
        } else {
          newFavorites.add(questionId);
        }
        return newFavorites;
      });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const getScoreMessage = () => {
    if (percentage === 100) return "Perfect! 🎉";
    if (percentage >= 80) return "Great job! 💪";
    if (percentage >= 60) return "Good effort! 📚";
    if (percentage >= 40) return "Keep practicing! 🎯";
    return "Don't give up! 💡";
  };

  const getScoreColor = () => {
    if (percentage >= 80) return 'var(--accent-green)';
    if (percentage >= 60) return 'var(--accent-cyan)';
    if (percentage >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div className="results-page page">
      <div className="container">
        <motion.div 
          className="results-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Quiz Complete!</h1>
          <p className="topic-info">{topicName} • {mode}</p>
        </motion.div>

        <motion.div 
          className="score-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="score-circle" style={{ '--score-color': getScoreColor() }}>
            <svg viewBox="0 0 100 100">
              <circle className="score-bg" cx="50" cy="50" r="45" />
              <circle 
                className="score-progress" 
                cx="50" 
                cy="50" 
                r="45"
                style={{ 
                  strokeDasharray: `${percentage * 2.83} 283`,
                  stroke: getScoreColor()
                }}
              />
            </svg>
            <div className="score-content">
              <span className="score-percent">{percentage}%</span>
              <span className="score-label">{getScoreMessage()}</span>
            </div>
          </div>

          <div className="score-stats">
            <div className="stat correct">
              <span className="stat-value">{correctCount}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat incorrect">
              <span className="stat-value">{incorrectCount}</span>
              <span className="stat-label">Incorrect</span>
            </div>
            <div className="stat total">
              <span className="stat-value">{totalAnswered}</span>
              <span className="stat-label">Answered</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="results-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button 
            className="action-btn primary"
            onClick={() => navigate(`/quiz/${topicId}/${mode}`)}
          >
            Try Again ({mode})
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => navigate('/')}
          >
            All Topics
          </button>
        </motion.div>

        {results.length > 0 && (
          <motion.div 
            className="results-breakdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2>Question Breakdown</h2>
            
            <div className="breakdown-list">
              {results.map((result, index) => {
                const question = questions.find(q => q.questionId === result.questionId);
                if (!question) return null;
                
                return (
                  <motion.div 
                    key={result.questionId}
                    className={`breakdown-item ${result.isCorrect ? 'correct' : 'incorrect'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <div className="breakdown-header">
                      <span className={`status-badge ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                        {result.isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="question-num">Q{index + 1}</span>
                      <button 
                        className={`favorite-toggle ${favorites.has(result.questionId) ? 'is-favorite' : ''}`}
                        onClick={() => toggleFavorite(result.questionId)}
                      >
                        {favorites.has(result.questionId) ? '★' : '☆'}
                      </button>
                    </div>
                    
                    <p className="breakdown-question">{question.question}</p>
                    
                    <div className="breakdown-answer">
                      <span className="answer-label">Answer:</span>
                      <span className="answer-value">{question.answer}</span>
                    </div>
                    
                    {question.explanation && (
                      <div className="breakdown-explanation">
                        <span className="explanation-label">Explanation:</span>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Results;

