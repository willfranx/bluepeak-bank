import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!username) return;
    onLogin(username);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div>
          <label>
            Username:{' '}
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Login</button>
        </div>
      </form>
      <p style={{ marginTop: 12, color: '#666' }}>Tip: any username will log you in for this demo.</p>
    </div>
  );
}
