import React from 'react';

export default function Accounts({ accounts }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Your Accounts</h2>
      <ul>
        {accounts.map((a) => (
          <li key={a.id} style={{ marginBottom: 8 }}>
            <strong>{a.name}</strong>: ${a.balance.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
