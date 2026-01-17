import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaNewspaper, FaBell, FaPhone, FaMapMarkedAlt, FaFileAlt, FaChartLine, FaUserShield, FaTasks, FaUsers, FaSignInAlt, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Don't render user-specific content while loading
    const isLoadingAuth = loading;

    // Helper to check active route
    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
            <div className="navbar-container">
                {/* Brand Section */}
                <Link
                    to={user ? (user.role === 'admin' ? '/admin' : user.role === 'volunteer' ? '/volunteer' : '/dashboard') : '/'}
                    className="navbar-brand"
                >
                    <span className="brand-icon">🚨</span>
                    <div className="brand-text">
                        <span className="brand-main">Crisis</span>
                        <span className="brand-sub">Connect</span>
                    </div>
                </Link>

                {/* Mobile Hamburger Toggle */}
                <div className="mobile-toggle" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </div>

                {/* Desktop & Tablet Navigation */}
                <div className={`navbar-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="nav-links-left">
                        <Link to="/" className={`nav-link ${isActive('/')}`}>
                            <FaHome className="link-icon" /> Home
                        </Link>
                        <Link to="/about" className={`nav-link ${isActive('/about')}`}>
                            <FaInfoCircle className="link-icon" /> About
                        </Link>
                        {!user || user.role !== 'admin' ? (
                            <Link to="/alerts" className={`nav-link ${isActive('/alerts')}`}>
                                <FaBell className="link-icon" /> Alerts
                            </Link>
                        ) : null}
                        <Link to="/news" className={`nav-link ${isActive('/news')}`}>
                            <FaNewspaper className="link-icon" /> News
                        </Link>
                        <Link to="/contact" className={`nav-link ${isActive('/contact')}`}>
                            <FaPhone className="link-icon" /> Contact
                        </Link>
                    </div>

                    <div className="nav-actions-right">
                        {!isLoadingAuth && user ? (
                            <>
                                <div className="user-menu-items">


                                    {user.role === 'civilian' && (
                                        <Link to="/report-incident" className={`nav-link ${isActive('/report-incident')}`}>
                                            <FaFileAlt className="link-icon" /> Report
                                        </Link>
                                    )}

                                    <Link to={user.role === 'admin' ? "/admin" : user.role === 'volunteer' ? "/volunteer" : "/dashboard"} className={`nav-link ${isActive('/dashboard') || isActive('/admin') || isActive('/volunteer')}`}>
                                        <FaChartLine className="link-icon" /> Dashboard
                                    </Link>

                                    {/* Admin Quick Links shown in main nav on mobile, or if needed */}
                                    {user.role === 'admin' && (
                                        <div className="admin-items-mobile-only">
                                            <Link to="/admin/incidents" className={`nav-link ${isActive('/admin/incidents')}`}>
                                                <FaUserShield /> Admin
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="user-profile-actions">
                                    <span className="user-greeting">Hi, {user.name.split(' ')[0]}</span>
                                    <button onClick={handleLogout} className="btn-logout">
                                        <FaSignOutAlt />
                                    </button>
                                </div>
                            </>
                        ) : !isLoadingAuth ? (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn-login-ghost">
                                    <FaSignInAlt className="btn-icon" /> Login
                                </Link>
                                <Link to="/register" className="btn-register-primary">
                                    <FaUserPlus className="btn-icon" /> Get Started
                                </Link>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Admin Second Navbar Row - Desktop Only */}
            {/* Admin Second Navbar Row - Removed as per modular dashboard design */}
        </nav>
    );
};

export default Navbar;

