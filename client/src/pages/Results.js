import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Results.css';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);

  const { quiz, answers, mode } = location.state || {};

  useEffect(() => {
    if (!quiz || !answers) {
      navigate('/');
      return;
    }
    saveResults();
  }, []);

  async function saveResults() {
    try {
      const results = answers.filter(a => a !== null).map(a => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect
      }));

      await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          topicId: quiz.topicId,
          mode,
          results
        })
      });
      setSaved(true);
    } catch (error) {
      console.error('Error saving results:', error);
    } finally {
      setSaving(false);
    }
  }

  if (!quiz || !answers) {
    return null;
  }

  const correctCount = answers.filter(a => a?.isCorrect).length;
  const totalCount = answers.filter(a => a !== null).length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const modeLabels = {
    remaining: 'Quiz',
    mistakes: 'Review Mistakes',
    mastered: 'Review Mastered'
  };

  function getScoreMessage() {
    if (percentage === 100) return "Perfect score! Outstanding!";
    if (percentage >= 80) return "Great job! Keep it up!";
    if (percentage >= 60) return "Good effort! Room to improve.";
    if (percentage >= 40) return "Keep practicing!";
    return "Don't give up! Try again.";
  }

  function getScoreEmoji() {
    if (percentage === 100) return "🏆";
    if (percentage >= 80) return "🌟";
    if (percentage >= 60) return "👍";
    if (percentage >= 40) return "💪";
    return "📚";
  }

  return (
    <div className="results-page">
      <div className="results-container slide-up">
        <div className="results-header">
          <span className="score-emoji">{getScoreEmoji()}</span>
          <h1>Quiz Complete!</h1>
          <p className="topic-name">{quiz.topicName}</p>
          <span className={`mode-badge ${mode}`}>{modeLabels[mode]}</span>
        </div>

        <div className="score-card">
          <div className="score-circle">
            <svg viewBox="0 0 100 100">
              <circle
                className="score-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
              />
              <circle
                className="score-fill"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${percentage * 2.83} 283`}
                style={{
                  stroke: percentage >= 60 ? 'var(--success)' : 
                          percentage >= 40 ? 'var(--warning)' : 'var(--error)'
                }}
              />
            </svg>
            <div className="score-text">
              <span className="score-number">{percentage}%</span>
            </div>
          </div>

          <div className="score-details">
            <div className="score-stat">
              <span className="stat-value correct">{correctCount}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="score-divider"></div>
            <div className="score-stat">
              <span className="stat-value incorrect">{totalCount - correctCount}</span>
              <span className="stat-label">Incorrect</span>
            </div>
            <div className="score-divider"></div>
            <div className="score-stat">
              <span className="stat-value total">{totalCount}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>

          <p className="score-message">{getScoreMessage()}</p>
        </div>

        {saving ? (
          <div className="saving-status">
            <div className="loader small"></div>
            <span>Saving your progress...</span>
          </div>
        ) : saved && (
          <div className="saving-status success">
            <span>✓ Progress saved</span>
          </div>
        )}

        <div className="results-summary">
          <h3>Question Summary</h3>
          <div className="summary-list">
            {quiz.questions.map((question, index) => {
              const answer = answers[index];
              const isCorrect = answer?.isCorrect;

              return (
                <div key={index} className={`summary-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="summary-icon">
                    {isCorrect ? '✓' : '✗'}
                  </div>
                  <div className="summary-content">
                    <p className="summary-question">{question.question}</p>
                    {!isCorrect && (
                      <p className="summary-answer">
                        Correct: <strong>{question.answer}</strong>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="results-actions">
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/quiz/${quiz.topicId}/${mode}`)}
          >
            Try Again
          </button>
          <button 
            className="btn btn-secondary btn-lg"
            onClick={() => navigate('/')}
          >
            Back to Topics
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;

