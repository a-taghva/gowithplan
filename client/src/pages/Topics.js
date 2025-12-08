import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import './Topics.css';

const Topics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetModal, setResetModal] = useState({ show: false, topicId: null, topicName: '' });
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const token = await getToken();
      const response = await axios.get('/api/topics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopics(response.data);
    } catch (err) {
      setError('Failed to load topics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (topicId, mode) => {
    navigate(`/quiz/${topicId}/${mode}`);
  };

  const viewFavorites = (topicId) => {
    navigate(`/favorites/${topicId}`);
  };

  const showResetModal = (topicId, topicName) => {
    setResetModal({ show: true, topicId, topicName });
  };

  const closeResetModal = () => {
    setResetModal({ show: false, topicId: null, topicName: '' });
  };

  const confirmReset = async () => {
    const { topicId } = resetModal;
    closeResetModal();
    
    try {
      const token = await getToken();
      await axios.delete(`/api/topics/${topicId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh topics to show updated counts
      fetchTopics();
    } catch (err) {
      console.error('Failed to reset progress:', err);
    }
  };

  if (loading) {
    return (
      <div className="topics-page page">
        <div className="container">
          <div className="topics-header">
            <h1>Your Topics</h1>
            <p>Select a topic and mode to start practicing</p>
          </div>
          <div className="topics-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="topic-card skeleton-card">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-stats"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topics-page page">
        <div className="container">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchTopics} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topics-page page">
      <div className="container">
        <motion.div 
          className="topics-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Your Topics</h1>
          <p>Select a topic and mode to start practicing</p>
        </motion.div>

        <div className="topics-grid">
          {topics.map((topic, index) => (
            <motion.div
              key={topic._id}
              className="topic-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="topic-header">
                <div className="topic-title-row">
                  <h2 className="topic-name">{topic.topic}</h2>
                  <button 
                    className="reset-btn"
                    onClick={() => showResetModal(topic.topicId, topic.topic)}
                    title="Reset progress"
                  >
                    ↺
                  </button>
                </div>
                <span className="topic-total">{topic.totalQuestions} questions</span>
              </div>

              <div className="topic-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-mastered" 
                    style={{ width: `${(topic.mastered / topic.totalQuestions) * 100}%` }}
                  ></div>
                  <div 
                    className="progress-mistakes" 
                    style={{ width: `${(topic.mistakes / topic.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="topic-stats">
                <button 
                  className="stat-btn stat-remaining"
                  onClick={() => startQuiz(topic.topicId, 'remaining')}
                  disabled={topic.remaining === 0}
                >
                  <span className="stat-count">{topic.remaining}</span>
                  <span className="stat-label">Remaining</span>
                </button>
                
                <button 
                  className="stat-btn stat-mistakes"
                  onClick={() => startQuiz(topic.topicId, 'mistakes')}
                  disabled={topic.mistakes === 0}
                >
                  <span className="stat-count">{topic.mistakes}</span>
                  <span className="stat-label">Mistakes</span>
                </button>
                
                <button 
                  className="stat-btn stat-mastered"
                  onClick={() => startQuiz(topic.topicId, 'mastered')}
                  disabled={topic.mastered === 0}
                >
                  <span className="stat-count">{topic.mastered}</span>
                  <span className="stat-label">Mastered</span>
                </button>
              </div>

              {topic.favoriteCount > 0 && (
                <button 
                  className="favorites-btn"
                  onClick={() => viewFavorites(topic.topicId)}
                >
                  <span className="star-icon">⭐</span>
                  <span>{topic.favoriteCount} Favorites</span>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reset Progress Modal */}
      {resetModal.show && (
        <div className="modal-overlay" onClick={closeResetModal}>
          <motion.div 
            className="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">↺</div>
            <h3>Reset Progress?</h3>
            <p>
              This will clear all progress for <strong>{resetModal.topicName}</strong>.
              <br />
              <span className="modal-note">Your favorites will be kept.</span>
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={closeResetModal}>
                Cancel
              </button>
              <button className="modal-confirm" onClick={confirmReset}>
                Reset Progress
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Topics;

