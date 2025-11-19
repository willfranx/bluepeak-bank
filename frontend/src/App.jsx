import React, { useState, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Accounts from "./pages/Accounts";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import SignUp from "./pages/SignUp";
import Transactions from "./pages/Transactions";
import Transfer from "./pages/Transfer";

import NavBar from "./components/NavBar";
import api from "./services/api";

function App() {
  // Basic in-memory auth and accounts state for demo purposes
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Restore persisted user from localStorage (simple client-side persistence for dev)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("bluepeak_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.userid) {
          setUser(parsed);
          // load accounts for restored user
          fetchAccounts(parsed);
        }
      }
    } catch (err) {
      console.warn("Failed to restore user from localStorage", err);
    }
  }, []);

  // Fetch accounts for the current user from backend and set state
  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/accounts`, { withCredentials: true });
      if (res.data && res.data.success) {
        const payload = res.data.data ?? res.data.accounts ?? res.data;
        setAccounts(Array.isArray(payload) ? payload : []);
      } else {
        console.warn("Failed to fetch accounts:", res.data?.message);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  // initialAccounts array will load user name in navbar and profile information
  // right away after account registration
  const login = (user, initialAccounts) => {
    setUser(user);
    try {
      window.localStorage.setItem("bluepeak_user", JSON.stringify(user));
    } catch (err) {
      console.warn("Failed to persist user to localStorage", err);
    }

    if (Array.isArray(initialAccounts) && initialAccounts.length > 0) {
      setAccounts(initialAccounts);
    } else {
      // load user's real accounts after login
      fetchAccounts();
    }
  };

  const logout = () => {
    (async () => {
      try {
        await api.post(`/auth/logout`, {}, { withCredentials: true });
      } catch (err) {
        console.warn("Logout request failed", err?.response?.data || err.message || err);
      }

      // Clear local client state regardless of backend response
      setUser(null);
      setAccounts([]);
      try {
        window.localStorage.removeItem("bluepeak_user");
      } catch (err) {
        /* ignore */
      }
    })();
  };

  const transfer = async (_payload = {}) => {
    if (user) await fetchAccounts();
  };

  return (
    <Router>
      <div className="App">
        <NavBar user={user} onLogout={logout} />
        <div className="App-body">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/accounts" replace />
                ) : (
                  <Login onLogin={login} />
                )
              }
            />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/accounts" replace />
                ) : (
                  <Login onLogin={login} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                user ? (
                  <Navigate to="/accounts" replace />
                ) : (
                  <SignUp onLogin={login} />
                )
              }
            />
            <Route
              path="/accounts"
              element={
                user ? (
                  <Accounts accounts={accounts} user={user} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/transfer"
              element={
                user ? (
                  <Transfer accounts={accounts} onTransfer={transfer} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/transactions"
              element={
                user ? (
                  <Transactions user={user} accounts={accounts} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/profile"
              element={
                user ? (
                  <Profile
                    user={user}
                    onUserUpdate={(updated) => {
                      // update top-level user and persist
                      setUser(updated);
                      try {
                        if (updated && updated.userid) {
                          window.localStorage.setItem("bluepeak_user", JSON.stringify(updated));
                        } else {
                          window.localStorage.removeItem("bluepeak_user");
                        }
                      } catch (err) {
                        console.warn("Failed to persist updated user", err);
                      }
                    }}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
