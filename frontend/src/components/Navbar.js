import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Don't render user-specific content while loading to prevent flashing
  const isLoadingAuth = loading;

  return (
    <>
    <nav className="navbar navbar-home">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🚨</span>
          <span className="brand-text">
            <span className="brand-main">Crisis</span>
            <span className="brand-sub">Connect</span>
          </span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link-home">
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </Link>
          <Link to="/about" className="nav-link-home">
            <span className="nav-icon">ℹ️</span>
            <span>About</span>
          </Link>
          <Link to="/news" className="nav-link-home">
            <span className="nav-icon">📰</span>
            <span>News</span>
          </Link>
          <Link to="/alerts" className="nav-link-home">
            <span className="nav-icon">🔔</span>
            <span>Alerts</span>
          </Link>
          <Link to="/contact" className="nav-link-home">
            <span className="nav-icon">📞</span>
            <span>Contact</span>
          </Link>
          {!isLoadingAuth && user ? (
            <>
              <Link to="/map" className="nav-link-home">
                <span className="nav-icon">🗺️</span>
                <span>Map View</span>
              </Link>
                {user.role === 'civilian' && (
                  <Link to="/report-incident" className="nav-link-home">
                    <span className="nav-icon">📝</span>
                    <span>Report Incident</span>
                  </Link>
                )}
              <Link to="/dashboard" className="nav-link-home">
                <span className="nav-icon">📊</span>
                <span>Dashboard</span>
              </Link>
                {user.role === 'volunteer' ? (
                  <>
                <Link to="/volunteer" className="nav-link-home volunteer-link">
                  <span className="nav-icon">👷</span>
                  <span>Volunteer Portal</span>
                </Link>
                    <Link to="/volunteer/tasks" className="nav-link-home">
                      <span className="nav-icon">✅</span>
                      <span>My Tasks</span>
                    </Link>
                  </>
              ) : null}
              <span className="user-name">{user.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
                  <ThemeToggle />
                </div>
            </>
          ) : !isLoadingAuth ? (
            <>
              <Link to="/login" className="nav-link-home">
                <span className="nav-icon">🔐</span>
                <span>Login</span>
              </Link>
              <Link to="/register" className="nav-link-home">
                <span className="nav-icon">📝</span>
                <span>Register</span>
              </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <ThemeToggle />
                </div>
            </>
          ) : null}
        </div>
        </div>
      </nav>

      {/* Admin Second Navbar Row */}
      {!isLoadingAuth && user && user.role === 'admin' && (
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

