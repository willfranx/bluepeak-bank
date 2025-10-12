import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bankingAPI } from '../api';

function TransferFunds() {
  const [balance, setBalance] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await bankingAPI.getBalance();
      setBalance(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await bankingAPI.transfer(recipient, amount);
      setSuccess(`Successfully transferred $${amount} to ${recipient}`);
      setBalance({ ...balance, balance: response.data.newBalance });
      setRecipient('');
      setAmount('');
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  return (
    <div className="container dashboard-container">
      <h1>BluePeak Bank</h1>
      
      {balance && (
        <div className="balance-card">
          <h2>Your Balance</h2>
          <div className="balance-amount">${formatAmount(balance.balance)}</div>
          <p>Account: {balance.username}</p>
        </div>
      )}

      <div className="navigation">
        <button className="nav-button" onClick={() => navigate('/dashboard')}>
          View Balances
        </button>
        <button className="nav-button active">Transfer Funds</button>
      </div>

      <h2>Transfer Funds</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Recipient Username</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            placeholder="Enter recipient's username"
          />
        </div>
        
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="Enter amount"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Transfer'}
        </button>
      </form>

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default TransferFunds;
