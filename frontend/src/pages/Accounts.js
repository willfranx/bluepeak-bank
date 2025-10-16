import React from 'react';

export default function Accounts({ accounts }) {
  return (
    <div className="App-body">
      <div className="card">
        <h2>Your Accounts</h2>
        <ul className="accounts-list">
          {accounts.map((a) => (
            <li key={a.id}>
              <div>{a.name}</div>
              <div><strong>${a.balance.toFixed(2)}</strong></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
