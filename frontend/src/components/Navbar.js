import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
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
          <Link to="/" style={styles.navLink}>Dashboard</Link>
          <Link to="/all-tasks" style={styles.navLink}>All Tasks</Link>
          <Link to="/statistics" style={styles.navLink}>Statistics</Link>
        </div>
        <span style={styles.username}>Welcome, {user?.username}!</span>
      </div>
      <div style={styles.links}>
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
    gap: '1.5rem',
    alignItems: 'center'
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
