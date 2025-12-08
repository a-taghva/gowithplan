import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Topics from './pages/Topics';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {user && <Navbar />}
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Topics />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/quiz/:topicId/:mode" 
          element={
            <PrivateRoute>
              <Quiz />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/results" 
          element={
            <PrivateRoute>
              <Results />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/favorites/:topicId" 
          element={
            <PrivateRoute>
              <Favorites />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;

