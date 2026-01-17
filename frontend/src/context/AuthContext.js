import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import api from '../utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const isInitialMount = useRef(true);
  const isLoggingIn = useRef(false);

  const fetchUser = useCallback(async () => {
    // Skip fetchUser if we're in the middle of a login to prevent race conditions
    if (isLoggingIn.current) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch user on initial mount or when token changes from external source
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (token) {
        fetchUser();
      } else {
        setLoading(false);
      }
    } else if (token && !isLoggingIn.current && !user) {
      // Token changed but we're not logging in and don't have user, so fetch user
      fetchUser();
    }
  }, [token, fetchUser, user]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only respond to token changes
      if (e.key === 'token') {
        const newToken = e.newValue;

        // If token was removed in another tab, logout this tab
        if (!newToken) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        // If token changed to a different value, fetch the new user
        else if (newToken !== token) {
          setToken(newToken);
          // fetchUser will be triggered by the token change in the effect above
        }
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [token]);

  const login = async (email, password) => {
    // Prevent multiple simultaneous login attempts
    if (isLoggingIn.current) {
      throw new Error('Login already in progress');
    }

    try {
      isLoggingIn.current = true;
      setLoading(true);

      const response = await api.post('/api/auth/login', { email, password });

      // Check if response has the expected structure
      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid response from server');
      }

      const { token: newToken, user: userData } = response.data;

      // Set token and user immediately
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      // Reset flags immediately - no delays
      setLoading(false);
      isLoggingIn.current = false;

      return response.data;
    } catch (error) {
      console.error('Login error:', error);

      // Clean up on error
      setLoading(false);
      isLoggingIn.current = false;
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');

      // Handle network errors first
      if (!error.response) {
        // Network error - server not reachable
        if (error.message && error.message.includes('connect')) {
          error.message = 'Cannot connect to server. Please ensure the backend is running on http://localhost:5000';
        }
        throw error;
      }

      // Format error message properly for HTTP errors
      if (error.response?.data) {
        // Handle validation errors
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
          error.message = errorMessage;
        } else if (error.response.data.message) {
          error.message = error.response.data.message;
        }
      }

      throw error;
    }
  };

  const register = async (userData) => {
    // Prevent multiple simultaneous register attempts
    if (isLoggingIn.current) {
      throw new Error('Registration already in progress');
    }

    try {
      isLoggingIn.current = true;
      setLoading(true);

      const response = await api.post('/api/auth/register', userData);

      // Check if response has the expected structure
      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid response from server');
      }

      const { token: newToken, user: newUser } = response.data;

      // Set token and user immediately
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);

      // Reset flags immediately - no delays
      setLoading(false);
      isLoggingIn.current = false;

      return response.data;
    } catch (error) {
      console.error('Register error:', error);

      // Clean up on error
      setLoading(false);
      isLoggingIn.current = false;
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');

      // Format error message properly
      if (error.response?.data) {
        // Handle validation errors
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
          error.message = errorMessage;
        } else if (error.response.data.message) {
          error.message = error.response.data.message;
        }
      }

      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const googleLogin = async (credential, role) => {
    if (isLoggingIn.current) return;
    try {
      isLoggingIn.current = true;
      setLoading(true);
      const response = await api.post('/api/auth/google', { credential, role });

      if (response.data.status === 'pending_role') {
        setLoading(false);
        isLoggingIn.current = false; // Reset flag so next call (with role) works
        // Don't log in yet, just return the signal
        return response.data;
      }

      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid response from server');
      }

      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setLoading(false);
      isLoggingIn.current = false;
    } catch (error) {
      console.error('Google Login error:', error);
      setLoading(false);
      isLoggingIn.current = false;
      throw error;
    }
  };

  const value = {
    user,
    login,
    googleLogin,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

