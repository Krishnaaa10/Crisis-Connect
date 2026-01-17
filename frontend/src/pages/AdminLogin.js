
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminLogin.css';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in as admin
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'admin') {
                navigate('/admin/incidents');
            } else {
                toast.warning('Access Denied: Admin privileges required.');
                navigate('/dashboard');
            }
        }
    }, [user, loading, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Use existing login function
            await login(formData.email, formData.password);

            // Post-login role check is handled by the useEffect above
            // But we can check immediately if needed (requires login to return user, which it usually doesn't in AuthContext usually just sets state)
            // So we rely on the Effect to redirect.

        } catch (error) {
            toast.error(error.message || 'Authentication Failed');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-header">
                    <div className="admin-badge">RESTRICTED ACCESS</div>
                    <h1>Command Center Login</h1>
                    <p>Crisis Response System - Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-group">
                        <label>Operator ID (Email)</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@crisisconnect.com"
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label>Access Code (Password)</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="admin-login-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Authenticating...' : 'Authenticate'}
                    </button>
                </form>

                <div className="security-notice">
                    <span>🔒 256-bit Encryption Active</span>
                    Accessing this system without authorization is a federal offense.
                    <br />System Activity is Monitored and Logged.
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
