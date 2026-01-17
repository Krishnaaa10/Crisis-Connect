import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import RoleSelectionModal from '../components/RoleSelectionModal';
import './Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'civilian'
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempCredential, setTempCredential] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, googleLogin, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      toast.success('Registration successful!');
      // Navigate immediately - no delays
      navigate('/dashboard');
    } catch (error) {
      // Handle different error formats
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Validation errors
        errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
      } else if (error.response?.data?.message) {
        // Server error message
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Generic error message
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Don't pass role initially to force backend check
      const response = await googleLogin(credentialResponse.credential);

      // Check if we need to select a role (new user)
      if (response && response.status === 'pending_role') {
        setTempCredential(credentialResponse.credential);
        setShowRoleModal(true);
        toast.info('Please select a role to continue.');
      } else if (response && response.token) {
        toast.success('Google Sign In successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Google Sign In Failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-layout">
        <div className="auth-visual-side">
          <div className="auth-visual-content">
            <span className="auth-brand-badge">Join Crisis Connect</span>
            <h1>Be the Hero Your Community Needs</h1>
            <p>Whether you need help or want to provide it, we connect you with the right people at the right time.</p>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Join us to help or get help during disasters</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password (min. 6 characters)"
                    required
                    minLength="6"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <div className="input-wrapper">
                  <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="civilian">Civilian - I need help</option>
                    <option value="volunteer">Volunteer - I want to help</option>
                    <option value="admin">Admin - System Administrator</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="auth-divider">
                <span>OR</span>
              </div>


              <div className="google-auth-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error('Login Failed');
                  }}
                  useOneTap
                  theme="filled_blue"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </form>

            <RoleSelectionModal
              isOpen={showRoleModal}
              onClose={() => setShowRoleModal(false)}
              onConfirm={async (role) => {
                try {
                  setShowRoleModal(false);
                  await googleLogin(tempCredential, role);
                  toast.success('Account created successfully!');
                  navigate('/dashboard');
                } catch (error) {
                  toast.error(error.message || 'Registration failed');
                }
              }}
            />

            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
