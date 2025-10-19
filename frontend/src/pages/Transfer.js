import React, { useState } from 'react';

export default function Transfer({ accounts, onTransfer }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!fromId || !toId || Number(amount) <= 0) {
      setMessage('Please pick accounts and a valid amount');
      return;
    }
    if (fromId === toId) {
      setMessage('Cannot transfer to the same account');
      return;
    }
    const from = accounts.find((a) => a.id === fromId);
    if (!from || from.balance < Number(amount)) {
      setMessage('Insufficient funds');
      return;
    }
    onTransfer({ fromId, toId, amount: Number(amount) });
    setMessage('Transfer complete');
    setAmount('');
  };

  return (
    <div className="App-body">
      <div className="card">
        <h2>Transfer Funds</h2>
        <form onSubmit={send} className="container">
          <div className="form-row">
            <label>From</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>To</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Amount</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <button className="btn" type="submit">Send</button>
          </div>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
