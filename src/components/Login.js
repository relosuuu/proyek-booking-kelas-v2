import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('classroom-scheduling-email');
    const savedTime = localStorage.getItem('classroom-scheduling-email-time');
    
    if (savedEmail && savedTime) {
      const daysPassed = (Date.now() - parseInt(savedTime)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 28) {
        setEmail(savedEmail);
        setRememberMe(true);
      } else {
        // Clear expired saved email
        localStorage.removeItem('classroom-scheduling-email');
        localStorage.removeItem('classroom-scheduling-email-time');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Fetch user from Supabase
      const response = await axios.get(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/users?email=eq.${email}`,
        {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data || response.data.length === 0) {
        setError('Email or password is incorrect');
        setLoading(false);
        return;
      }

      const user = response.data[0];

      // Validate password (simple comparison for now)
      if (user.password !== password) {
        setError('Email or password is incorrect');
        setLoading(false);
        return;
      }

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('classroom-scheduling-email', email);
        localStorage.setItem('classroom-scheduling-email-time', Date.now().toString());
      } else {
        localStorage.removeItem('classroom-scheduling-email');
        localStorage.removeItem('classroom-scheduling-email-time');
      }

      onLogin(user);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2a4e 0%, #6B4E8A 50%, #F4A89B 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '450px',
        padding: '50px 40px',
        animation: 'slideIn 0.5s ease-out',
      }}>
                {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* LOGO GOES HERE - Add your logo image */}
          <div style={{ marginBottom: '20px' }}>
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              style={{ height: '80px', width: 'auto' }} 
            />
          </div>
          
          <h1 style={{
            fontSize: '32px',
            color: '#1a2a4e',
            marginBottom: '10px',
            fontWeight: '700',
          }}>
            Classroom Scheduling
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B4E8A',
            marginBottom: '0',
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                fontSize: '14px',
                border: '2px solid #E8D4C8',
                borderRadius: '8px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
              onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                fontSize: '14px',
                border: '2px solid #E8D4C8',
                borderRadius: '8px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
              onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
            />
          </div>

          {/* Remember Me */}
          <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#C5587A',
              }}
            />
            <label
              htmlFor="rememberMe"
              style={{
                marginLeft: '10px',
                fontSize: '14px',
                color: '#6B4E8A',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Remember me
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#C5587A' : '#C5587A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s',
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#A8456F')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#C5587A')}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px 15px',
            backgroundColor: '#FFE5E5',
            border: '2px solid #FF6B6B',
            borderRadius: '8px',
            color: '#C5183D',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <p style={{
          marginTop: '30px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999',
        }}>
          <p>&copy; <span id="year"></span> A. Qalby.C All rights reserved.</p>
        </p>
      </div>

      

      {/* Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Login;