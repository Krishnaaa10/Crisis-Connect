import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import RoleSelectionModal from '../components/RoleSelectionModal';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, googleLogin, user, loading } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempCredential, setTempCredential] = useState(null);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'volunteer') {
        navigate('/volunteer');
      } else {
        navigate('/dashboard');
      }
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
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      const userData = await login(formData.email, formData.password);
      toast.success('Login successful!');
      // Navigate immediately - based on role if available, or default
      // Note: login() in AuthContext might only return user object if designed so. 
      // If we can't reliably get user here, we rely on the component re-rendering and the useEffect catching it.
      // But to be safe, we can default to dashboard and let useEffect redirect if needed, 
      // OR try to fetch user. For now, let's remove the explicit navigate and let useEffect handle it 
      // primarily, OR navigate to dashboard and let the effect redirect.
      // Actually, safest is to NOT navigate here if we trust the useEffect. 
      // But standard login flows often navigate manually. 
      // Let's try to trust the useEffect.
      // navigate('/dashboard'); <--- Removing this line to let useEffect handle routing based on state change.
      // Wait, if useEffect depends on `loading` changing, it might accept it.
      // Let's keep it simple: Navigate to dashboard, but if we are admin, useEffect will redirect us again?
      // No, that causes flash.
      // Let's assume login returns nothing and we let useEffect handle it.
      // But typically login functions are async.
      // Let's just remove the explicit navigate and see if useEffect picks it up. 
      // If `login` sets `user` state, the `useEffect` [user] dependency will fire.
      // So I will comment out the manual navigate.
    } catch (error) {
      // Handle different error formats
      let errorMessage = 'Login failed. Please try again.';

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

  return (
    <div className="auth-page">
      <div className="auth-split-layout">
        <div className="auth-visual-side">
          <div className="auth-visual-content">
            <span className="auth-brand-badge">Crisis Connect</span>
            <h1>Empowering Communities in Crisis</h1>
            <p>Join a network of dedicated volunteers and civilians working together to respond faster and save lives.</p>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
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
                    placeholder="Enter your password"
                    required
                  />
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
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <div className="google-auth-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const response = await googleLogin(credentialResponse.credential);
                      console.log('Google Login Response:', response);

                      // Check if we need to select a role
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
                  }}
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
                Don't have an account? <Link to="/register">Create Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
