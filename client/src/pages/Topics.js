import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topics.css';

function Topics() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [topicProgress, setTopicProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  async function fetchTopics() {
    try {
      const response = await fetch('/api/topics');
      const data = await response.json();
      setTopics(data);

      // Fetch progress for each topic
      if (user) {
        const progressPromises = data.map(topic =>
          fetch(`/api/users/${user.uid}/progress/${topic._id}`)
            .then(res => res.json())
            .then(progress => ({ topicId: topic._id, ...progress }))
        );
        const progressResults = await Promise.all(progressPromises);
        const progressMap = {};
        progressResults.forEach(p => {
          progressMap[p.topicId] = p;
        });
        setTopicProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleTopicClick(topic) {
    setSelectedTopic(selectedTopic?._id === topic._id ? null : topic);
  }

  function startQuiz(mode) {
    if (selectedTopic) {
      navigate(`/quiz/${selectedTopic._id}/${mode}`);
    }
  }

  function getProgressStats(topicId) {
    const progress = topicProgress[topicId] || {};
    const total = progress.totalQuestions || 0;
    const mastered = progress.masteredQuestions?.length || 0;
    const mistakes = progress.mistakeQuestions?.length || 0;
    const remaining = total - mastered - mistakes;
    return { total, mastered, mistakes, remaining };
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading topics...</p>
      </div>
    );
  }

  return (
    <div className="topics-page">
      <header className="header">
        <div className="logo">QuizMaster</div>
        <div className="user-section">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              user?.displayName?.charAt(0) || 'U'
            )}
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="container">
        <div className="page-header slide-up">
          <h1>Select a Topic</h1>
          <p>Choose a topic to start practicing</p>
        </div>

        <div className="topics-grid">
          {topics.map((topic, index) => {
            const stats = getProgressStats(topic._id);
            const isSelected = selectedTopic?._id === topic._id;
            const progressPercent = stats.total > 0 
              ? Math.round((stats.mastered / stats.total) * 100) 
              : 0;

            return (
              <div
                key={topic._id}
                className={`topic-card slide-up ${isSelected ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleTopicClick(topic)}
              >
                <div className="topic-header">
                  <h3>{topic.topic}</h3>
                  <span className="question-count">{stats.total} questions</span>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="topic-stats">
                  <div className="stat">
                    <span className="stat-value remaining">{stats.remaining}</span>
                    <span className="stat-label">Remaining</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value mistakes">{stats.mistakes}</span>
                    <span className="stat-label">Mistakes</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value mastered">{stats.mastered}</span>
                    <span className="stat-label">Mastered</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="quiz-modes fade-in">
                    <button
                      className="mode-btn remaining-btn"
                      onClick={(e) => { e.stopPropagation(); startQuiz('remaining'); }}
                      disabled={stats.remaining === 0}
                    >
                      <span className="mode-icon">📝</span>
                      <span className="mode-text">Quiz</span>
                      <span className="mode-count">{stats.remaining}</span>
                    </button>
                    <button
                      className="mode-btn mistakes-btn"
                      onClick={(e) => { e.stopPropagation(); startQuiz('mistakes'); }}
                      disabled={stats.mistakes === 0}
                    >
                      <span className="mode-icon">🔄</span>
                      <span className="mode-text">Review Mistakes</span>
                      <span className="mode-count">{stats.mistakes}</span>
                    </button>
                    <button
                      className="mode-btn mastered-btn"
                      onClick={(e) => { e.stopPropagation(); startQuiz('mastered'); }}
                      disabled={stats.mastered === 0}
                    >
                      <span className="mode-icon">⭐</span>
                      <span className="mode-text">Review Mastered</span>
                      <span className="mode-count">{stats.mastered}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {topics.length === 0 && (
          <div className="empty-state">
            <p>No topics available</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Topics;

