import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Quiz.css';

function Quiz() {
  const { topicId, mode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    generateQuiz();
  }, [topicId, mode]);

  async function generateQuiz() {
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          mode,
          firebaseUid: user.uid
        })
      });
      const data = await response.json();
      
      if (data.questions.length === 0) {
        setError('No questions available for this mode.');
      } else {
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(null));
      }
    } catch (err) {
      setError('Failed to load quiz. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = quiz?.questions[currentIndex];
  const hasOptions = currentQuestion?.options && currentQuestion.options.length > 0;

  function handleOptionSelect(option) {
    if (showResult) return;
    setSelectedOption(option);
  }

  function handleRevealAnswer() {
    setRevealedAnswer(true);
  }

  function handleSelfAssessment(isCorrect) {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      questionId: currentQuestion.id,
      selectedAnswer: isCorrect ? currentQuestion.answer : 'incorrect',
      isCorrect
    };
    setAnswers(newAnswers);
    setShowResult(true);
  }

  function submitAnswer() {
    if (!selectedOption) return;

    const isCorrect = selectedOption === currentQuestion.answer;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption,
      isCorrect
    };
    setAnswers(newAnswers);
    setShowResult(true);
  }

  function nextQuestion() {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
      setRevealedAnswer(false);
    } else {
      // Quiz complete - navigate to results
      navigate('/results', {
        state: {
          quiz,
          answers,
          mode
        }
      });
    }
  }

  function exitQuiz() {
    if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      navigate('/');
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-page">
        <div className="quiz-error slide-up">
          <div className="error-icon">⚠️</div>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  const modeLabels = {
    remaining: 'Quiz',
    mistakes: 'Review Mistakes',
    mastered: 'Review Mastered'
  };

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <button className="btn btn-ghost" onClick={exitQuiz}>
          ← Exit
        </button>
        <div className="quiz-info">
          <span className="topic-name">{quiz?.topicName}</span>
          <span className={`mode-badge ${mode}`}>{modeLabels[mode]}</span>
        </div>
        <div className="progress-indicator">
          {currentIndex + 1} / {quiz?.questions.length}
        </div>
      </header>

      <div className="quiz-progress-bar">
        <div 
          className="quiz-progress-fill" 
          style={{ width: `${((currentIndex + 1) / quiz?.questions.length) * 100}%` }}
        />
      </div>

      <main className="quiz-content">
        <div className="question-card slide-up" key={currentIndex}>
          <div className="question-number">Question {currentIndex + 1}</div>
          <h2 className="question-text">{currentQuestion?.question}</h2>

          {hasOptions ? (
            // Multiple Choice Question
            <div className="options-list">
              {currentQuestion.options.map((option, index) => {
                let optionClass = 'option';
                if (showResult) {
                  if (option === currentQuestion.answer) {
                    optionClass += ' correct';
                  } else if (option === selectedOption && !answers[currentIndex]?.isCorrect) {
                    optionClass += ' incorrect';
                  }
                } else if (option === selectedOption) {
                  optionClass += ' selected';
                }

                return (
                  <button
                    key={index}
                    className={optionClass}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showResult}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="option-text">{option}</span>
                    {showResult && option === currentQuestion.answer && (
                      <span className="option-icon">✓</span>
                    )}
                    {showResult && option === selectedOption && option !== currentQuestion.answer && (
                      <span className="option-icon">✗</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // Self-Assessment Question (no options)
            <div className="self-assess-container">
              {!revealedAnswer ? (
                <button 
                  className="btn btn-primary btn-lg reveal-btn"
                  onClick={handleRevealAnswer}
                >
                  Reveal Answer
                </button>
              ) : (
                <div className="answer-revealed fade-in">
                  <div className="revealed-answer">
                    <span className="answer-label">Answer:</span>
                    <span className="answer-text">{currentQuestion.answer}</span>
                  </div>
                  
                  {!showResult && (
                    <div className="self-assess-buttons">
                      <p>Did you get it right?</p>
                      <div className="assess-btn-group">
                        <button 
                          className="btn btn-success"
                          onClick={() => handleSelfAssessment(true)}
                        >
                          ✓ I got it right
                        </button>
                        <button 
                          className="btn btn-error"
                          onClick={() => handleSelfAssessment(false)}
                        >
                          ✗ I got it wrong
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showResult && currentQuestion.explanation && (
            <div className="explanation fade-in">
              <span className="explanation-label">Explanation:</span>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        <div className="quiz-actions">
          {hasOptions && !showResult ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={submitAnswer}
              disabled={!selectedOption}
            >
              Submit Answer
            </button>
          ) : showResult ? (
            <button className="btn btn-primary btn-lg" onClick={nextQuestion}>
              {currentIndex < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default Quiz;

