import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isQuizPage = location.pathname.includes('/quiz/');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-text">GoWithPlan</span>
        </Link>

        {!isQuizPage && (
          <div className="navbar-user">
            <span className="user-name">{user?.displayName}</span>
            <Link to="/settings" className="settings-link" title="Settings">
              ⚙
            </Link>
            <button onClick={logout} className="logout-btn">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

