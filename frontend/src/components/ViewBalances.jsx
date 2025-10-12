import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bankingAPI } from '../api';

function ViewBalances() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        bankingAPI.getBalance(),
        bankingAPI.getTransactions()
      ]);

      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      setError('Failed to load data');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="container dashboard-container">
      <h1>BluePeak Bank</h1>
      
      {error && <div className="error">{error}</div>}
      
      {balance && (
        <div className="balance-card">
          <h2>Your Balance</h2>
          <div className="balance-amount">${formatAmount(balance.balance)}</div>
          <p>Account: {balance.username}</p>
        </div>
      )}

      <div className="navigation">
        <button className="nav-button active">View Balances</button>
        <button className="nav-button" onClick={() => navigate('/transfer')}>
          Transfer Funds
        </button>
      </div>

      <h2>Transaction History</h2>
      {transactions.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          No transactions yet
        </p>
      ) : (
        <div className="transaction-list">
          {transactions.map((transaction) => {
            const isSent = transaction.from_username === balance.username;
            return (
              <div
                key={transaction.id}
                className={`transaction-item ${isSent ? 'sent' : 'received'}`}
              >
                <div className="transaction-header">
                  <span>
                    {isSent ? `To: ${transaction.to_username}` : `From: ${transaction.from_username}`}
                  </span>
                  <span style={{ color: isSent ? '#f44336' : '#4caf50' }}>
                    {isSent ? '-' : '+'}${formatAmount(transaction.amount)}
                  </span>
                </div>
                <div className="transaction-details">
                  {formatDate(transaction.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default ViewBalances;
