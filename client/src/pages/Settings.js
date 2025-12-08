import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, getToken, logout } = useAuth();
  const [modal, setModal] = useState({ show: false, type: null });
  const [loading, setLoading] = useState(false);

  const openModal = (type) => {
    setModal({ show: true, type });
  };

  const closeModal = () => {
    setModal({ show: false, type: null });
  };

  const resetAllProgress = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      await axios.delete('/api/auth/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeModal();
      navigate('/');
    } catch (err) {
      console.error('Failed to reset progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      await axios.delete('/api/auth/account', {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeModal();
      await logout();
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page page">
      <div className="container">
        <motion.div 
          className="settings-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="back-link" onClick={() => navigate('/')}>
            ← Back to Topics
          </button>
          <h1>Settings</h1>
        </motion.div>

        <div className="settings-content">
          {/* Profile Section */}
          <motion.div 
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2>Profile</h2>
            <div className="profile-card">
              <div className="profile-info">
                <span className="profile-name">{user?.displayName}</span>
                <span className="profile-email">{user?.email}</span>
              </div>
            </div>
          </motion.div>

          {/* Data Section */}
          <motion.div 
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2>Data Management</h2>
            
            <div className="settings-item">
              <div className="settings-item-info">
                <h3>Reset All Progress</h3>
                <p>Clear all your progress across all topics. Favorites will also be removed.</p>
              </div>
              <button 
                className="settings-btn warning"
                onClick={() => openModal('reset')}
              >
                Reset Progress
              </button>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            className="settings-section danger-zone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2>Danger Zone</h2>
            
            <div className="settings-item">
              <div className="settings-item-info">
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all associated data. This cannot be undone.</p>
              </div>
              <button 
                className="settings-btn danger"
                onClick={() => openModal('delete')}
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      {modal.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <motion.div 
            className="modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {modal.type === 'reset' ? (
              <>
                <div className="modal-icon warning">↺</div>
                <h3>Reset All Progress?</h3>
                <p>
                  This will clear <strong>all your progress</strong> across every topic.
                  <br />
                  <span className="modal-note">All mastered questions, mistakes, and favorites will be removed.</span>
                </p>
                <div className="modal-actions">
                  <button className="modal-cancel" onClick={closeModal} disabled={loading}>
                    Cancel
                  </button>
                  <button 
                    className="modal-confirm warning" 
                    onClick={resetAllProgress}
                    disabled={loading}
                  >
                    {loading ? 'Resetting...' : 'Reset All Progress'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-icon danger">⚠</div>
                <h3>Delete Account?</h3>
                <p>
                  This will <strong>permanently delete</strong> your account and all data.
                  <br />
                  <span className="modal-note">This action cannot be undone.</span>
                </p>
                <div className="modal-actions">
                  <button className="modal-cancel" onClick={closeModal} disabled={loading}>
                    Cancel
                  </button>
                  <button 
                    className="modal-confirm danger" 
                    onClick={deleteAccount}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;

