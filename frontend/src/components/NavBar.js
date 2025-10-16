import React from 'react';
import { Link } from 'react-router-dom';

export default function NavBar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/accounts">Accounts</Link>
        <Link to="/transfer">Transfer</Link>
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-username">Hi, {user.username}</span>
            <button className="btn secondary" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
