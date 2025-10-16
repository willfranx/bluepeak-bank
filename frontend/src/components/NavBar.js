import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar({ user, onLogout }) {
  return (
    <nav style={{ padding: 12, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <Link to="/accounts" style={{ marginRight: 12 }}>Accounts</Link>
        <Link to="/transfer" style={{ marginRight: 12 }}>Transfer</Link>
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>Hi, {user.username}</span>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
