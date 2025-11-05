import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-brand">
            🚨 Crisis Connect
          </Link>
          <div className="navbar-links">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/news">News</Link>
            <Link to="/alerts">Alerts</Link>
            <Link to="/contact">Contact</Link>
            {user ? (
              <>
                <Link to="/map">Map View</Link>
                {user.role === 'civilian' && (
                  <Link to="/report-incident">Report Incident</Link>
                )}
                <Link to="/dashboard">Dashboard</Link>
                {user.role === 'volunteer' ? (
                  <>
                    <Link to="/volunteer" className="volunteer-link">
                      👷 Volunteer Portal
                    </Link>
                    <Link to="/volunteer/tasks">My Tasks</Link>
                  </>
                ) : null}
                <span className="user-name">{user.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <button onClick={handleLogout} className="btn btn-secondary">
                    Logout
                  </button>
                  <ThemeToggle />
                </div>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <ThemeToggle />
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Admin Second Navbar Row */}
      {user && user.role === 'admin' && (
        <nav className="navbar-admin-second">
          <div className="container">
            <div className="admin-nav-links">
              <Link to="/volunteer/tasks" className="admin-nav-btn">
                <span className="admin-nav-icon">📋</span>
                <span className="admin-nav-text">My Tasks</span>
              </Link>
              <Link to="/admin/incidents" className="admin-nav-btn">
                <span className="admin-nav-icon">🚨</span>
                <span className="admin-nav-text">Incidents</span>
              </Link>
              <Link to="/admin/tasks" className="admin-nav-btn">
                <span className="admin-nav-icon">✅</span>
                <span className="admin-nav-text">Tasks</span>
              </Link>
              <Link to="/admin/volunteers" className="admin-nav-btn">
                <span className="admin-nav-icon">👷</span>
                <span className="admin-nav-text">Volunteers</span>
              </Link>
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;

