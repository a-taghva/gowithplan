import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './Quiz.css';

const Quiz = () => {
  const { topicId, mode } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [topicName, setTopicName] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [topicId, mode]);

  const fetchQuestions = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`/api/quiz/${topicId}/${mode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.length === 0) {
        setError(`No ${mode} questions available`);
      } else {
        setQuestions(response.data);
        setTopicName(response.data[0]?.topic || '');
      }
    } catch (err) {
      setError('Failed to load questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = (option) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    
    // Immediately confirm the answer
    const isCorrect = option === currentQuestion.answer;
    setIsAnswered(true);
    
    setResults(prev => [...prev, {
      questionId: currentQuestion.questionId,
      isCorrect
    }]);
  };

  const handleRevealAnswer = () => {
    setIsRevealed(true);
  };

  const handleSelfAssessment = (wasCorrect) => {
    setIsAnswered(true);
    
    setResults(prev => [...prev, {
      questionId: currentQuestion.questionId,
      isCorrect: wasCorrect
    }]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsRevealed(false);
    } else {
      finishQuiz();
    }
  };

  const toggleFavorite = async () => {
    try {
      const token = await getToken();
      await axios.post('/api/quiz/favorite', {
        topicId,
        questionId: currentQuestion.questionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(currentQuestion.questionId)) {
          newFavorites.delete(currentQuestion.questionId);
        } else {
          newFavorites.add(currentQuestion.questionId);
        }
        return newFavorites;
      });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const finishQuiz = useCallback(async () => {
    try {
      const token = await getToken();
      await axios.post('/api/quiz/submit', {
        topicId,
        mode,
        results
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to submit results:', err);
    }

    navigate('/results', { 
      state: { 
        results, 
        questions, 
        topicId, 
        topicName,
        mode,
        favorites: Array.from(favorites)
      } 
    });
  }, [results, questions, topicId, topicName, mode, favorites, navigate, getToken]);

  const handleExit = () => {
    // Exit instantly and go to results page
    finishQuiz();
  };

  if (loading) {
    return (
      <div className="quiz-page page">
        <div className="quiz-loading">
          <div className="loading-spinner"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-page page">
        <div className="quiz-error">
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  const hasOptions = currentQuestion?.options && currentQuestion.options.length > 0;

  return (
    <div className="quiz-page page">
      <div className="quiz-container">
        <div className="quiz-header">
          <div className="quiz-info">
            <span className="quiz-topic">{topicName}</span>
            <span className="quiz-mode">{mode}</span>
          </div>
          
          <div className="quiz-progress">
            <span className="progress-text">
              {currentIndex + 1} / {questions.length}
            </span>
            <div className="progress-bar-mini">
              <div 
                className="progress-fill"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <button className="exit-btn" onClick={handleExit}>
            Exit Quiz
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="question-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="question-header">
              <span className="question-number">Question {currentIndex + 1}</span>
              <button 
                className={`favorite-btn ${favorites.has(currentQuestion?.questionId) ? 'is-favorite' : ''}`}
                onClick={toggleFavorite}
              >
                {favorites.has(currentQuestion?.questionId) ? '★' : '☆'}
              </button>
            </div>

            <h2 className="question-text">{currentQuestion?.question}</h2>

            {hasOptions ? (
              <div className="options-list">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn ${selectedAnswer === option ? 'selected' : ''} ${
                      isAnswered 
                        ? option === currentQuestion.answer 
                          ? 'correct' 
                          : selectedAnswer === option 
                            ? 'incorrect' 
                            : ''
                        : ''
                    }`}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={isAnswered}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-options">
                {!isRevealed ? (
                  <button className="reveal-btn" onClick={handleRevealAnswer}>
                    Reveal Answer
                  </button>
                ) : (
                  <div className="revealed-answer">
                    <span className="answer-label">Answer:</span>
                    <p className="answer-text">{currentQuestion?.answer}</p>
                    
                    {!isAnswered && (
                      <div className="self-assessment">
                        <p>Did you get it right?</p>
                        <div className="assessment-btns">
                          <button 
                            className="assessment-btn correct"
                            onClick={() => handleSelfAssessment(true)}
                          >
                            Yes, I got it right
                          </button>
                          <button 
                            className="assessment-btn incorrect"
                            onClick={() => handleSelfAssessment(false)}
                          >
                            No, I got it wrong
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAnswered && currentQuestion?.explanation && (
              <motion.div 
                className="explanation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="explanation-label">Explanation:</span>
                <p>{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {isAnswered && (
          <div className="quiz-actions">
            <button className="next-btn" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;

