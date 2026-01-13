import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import './Settings.css';

function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setMessage({ type: 'success', text: 'Password changed successfully' });
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Settings</h1>

        {/* Profile Section */}
        <section className="settings-section">
          <h2>Profile Information</h2>
          <div className="profile-info">
            <div className="info-row">
              <label>Username:</label>
              <span>{user?.username || 'N/A'}</span>
            </div>
            <div className="info-row">
              <label>Email:</label>
              <span>{user?.email || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="theme-toggle-section">
            <div className="theme-option">
              <label>Theme Mode:</label>
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span className="theme-text">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </button>
            </div>
            <p className="theme-description">
              Choose between light and dark theme for better visibility
            </p>
          </div>
        </section>

        {/* Password Change Section */}
        <section className="settings-section">
          <h2>Change Password</h2>
          
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-group">
              <label>Current Password:</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </section>

        {/* Account Actions */}
        <section className="settings-section danger-zone">
          <h2>Account Actions</h2>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </section>
      </div>
    </div>
  );
}

export default Settings;
