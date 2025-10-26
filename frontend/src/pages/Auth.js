import React, { useState } from "react";
import { motion } from "framer-motion";
import './Auth.css';
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await authAPI.login(email, password);
        // login returns { token, user }
  login(data.user, data.token);
  navigate(from);
      } else {
        // Signup flow: create user then auto-login
        try {
          await authAPI.signup({ name, email, password });
        } catch (signupErr) {
          // Handle duplicate user or validation errors
          const message = signupErr?.response?.data?.error || signupErr.message;
          if (/duplicate|exists|E11000/i.test(message)) {
            setError('A user with that email already exists. Please login instead.');
            setLoading(false);
            return;
          }
          setError(message || 'Signup failed');
          setLoading(false);
          return;
        }

        // After successful signup, call login to get token
  const loginData = await authAPI.login(email, password);
  login(loginData.user, loginData.token);
  navigate(from);
      }
    } catch (err) {
      const message = err?.response?.data?.error || err.message;
      setError(message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">{isLogin ? "Welcome back" : "Create account"}</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                className="auth-input"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-actions">
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Login' : 'Sign Up')}
              </button>
              <button type="button" className="auth-toggle" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
                {isLogin ? "Create account" : "Have an account? Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
