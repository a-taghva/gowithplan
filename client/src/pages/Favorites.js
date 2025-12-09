import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import './Favorites.css';

const Favorites = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, [topicId]);

  const fetchFavorites = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`/api/topics/${topicId}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(response.data);
    } catch (err) {
      setError('Failed to load favorites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (questionId) => {
    try {
      const token = await getToken();
      await axios.post('/api/quiz/favorite', {
        topicId,
        questionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setQuestions(prev => prev.filter(q => q.questionId !== questionId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  const clearAllFavorites = async () => {
    setShowClearModal(false);
    try {
      const token = await getToken();
      await axios.delete(`/api/topics/${topicId}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions([]);
    } catch (err) {
      console.error('Failed to clear favorites:', err);
    }
  };

  const toggleExpand = (questionId) => {
    setExpandedId(expandedId === questionId ? null : questionId);
  };

  if (loading) {
    return (
      <div className="favorites-page page">
        <div className="container">
          <div className="favorites-loading">
            <div className="loading-spinner"></div>
            <p>Loading favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-page page">
        <div className="container">
          <div className="favorites-error">
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="back-btn">
              Back to Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topicName = questions[0]?.topic || 'Favorites';

  return (
    <div className="favorites-page page">
      <div className="container">
        <motion.div 
          className="favorites-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="favorites-header-top">
            <button className="back-link" onClick={() => navigate('/')}>
              ← Back to Topics
            </button>
            {questions.length > 0 && (
              <button 
                className="clear-all-btn"
                onClick={() => setShowClearModal(true)}
              >
                Clear All
              </button>
            )}
          </div>
          <h1>⭐ Favorites</h1>
          <p>{topicName} • {questions.length} saved questions</p>
        </motion.div>

        {questions.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="empty-icon">☆</span>
            <h2>No favorites yet</h2>
            <p>Star questions during quizzes to save them here for review.</p>
            <button className="back-btn" onClick={() => navigate('/')}>
              Start a Quiz
            </button>
          </motion.div>
        ) : (
          <div className="favorites-list">
            {questions.map((question, index) => (
              <motion.div
                key={question.questionId}
                className={`favorite-card ${expandedId === question.questionId ? 'expanded' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div 
                  className="favorite-header"
                  onClick={() => toggleExpand(question.questionId)}
                >
                  <span className="favorite-number">#{index + 1}</span>
                  <p className="favorite-question">{question.question}</p>
                  <button 
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(question.questionId);
                    }}
                    title="Remove from favorites"
                  >
                    ✕
                  </button>
                </div>

                {expandedId === question.questionId && (
                  <motion.div 
                    className="favorite-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="favorite-answer">
                      <span className="section-label">Answer:</span>
                      <p>{question.answer}</p>
                    </div>

                    {question.explanation && (
                      <div className="favorite-explanation">
                        <span className="section-label">Explanation:</span>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Modal */}
      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <motion.div 
            className="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">⭐</div>
            <h3>Clear All Favorites?</h3>
            <p>
              This will remove all <strong>{questions.length}</strong> favorites from this topic.
              <br />
              <span className="modal-note">This action cannot be undone.</span>
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button className="modal-confirm" onClick={clearAllFavorites}>
                Clear All
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Favorites;

