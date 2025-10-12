import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (isRegistering) {
        response = await authAPI.register(username, password);
      } else {
        response = await authAPI.login(username, password);
      }

      // Save token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>BluePeak Bank</h1>
      <h2>{isRegistering ? 'Create Account' : 'Login'}</h2>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Login')}
        </button>
      </form>

      <div className="toggle-text">
        {isRegistering ? (
          <>
            Already have an account?{' '}
            <span className="toggle-link" onClick={() => setIsRegistering(false)}>
              Login here
            </span>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <span className="toggle-link" onClick={() => setIsRegistering(true)}>
              Create one
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
