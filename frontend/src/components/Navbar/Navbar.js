import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <h2 style={styles.title}>Task Manager</h2>
      <div style={styles.center}>
        <div style={styles.navLinks}>
          <Link to="/" style={styles.navLink}>Today</Link>
          <Link to="/all-tasks" style={styles.navLink}>All Tasks</Link>
          <Link to="/calendar" style={styles.navLink}>Calendar</Link>
          <Link to="/statistics" style={styles.navLink}>Statistics</Link>
          <Link to="/settings" style={styles.navLink}>Settings</Link>
        </div>
        <span style={styles.username}>Welcome, {user?.username}!</span>
      </div>
      <div style={styles.links}>
        <button onClick={toggleTheme} style={styles.themeBtn} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#282c34',
    color: 'white'
  },
  title: {
    margin: 0
  },
  center: {
    flex: 1,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    justifyContent: 'center'
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  },
  username: {
    color: '#61dafb'
  },
  links: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  themeBtn: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    padding: '0.5rem 0.75rem',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    width: '40px',
    height: '40px'
  },
  logoutBtn: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};

export default Navbar;
