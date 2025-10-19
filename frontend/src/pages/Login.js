import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!username) return;
    onLogin(username);
  };

  return (
    <div className="App-body">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={submit} className="container">
          <div className="form-row">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" />
          </div>
          <div className="form-row">
            <button className="btn" type="submit">Login</button>
          </div>
        </form>
        <p className="message">Tip: any username will log you in for this demo.</p>
      </div>
    </div>
  );
}
