import React, { useState, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Accounts from "./pages/Accounts";
import Transfer from "./pages/Transfer";
import NavBar from "./components/NavBar";
import api from "./services/api";

function App() {
  // Basic in-memory auth and accounts state for demo purposes
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Fetch accounts for the current user from backend and set state
  const fetchAccounts = async (forUser) => {
    if (!forUser || !forUser.userid) return;
    try {
      const res = await api.get(`accounts/insecure/${forUser.userid}`);
      if (res.data && res.data.success) {
        setAccounts(res.data.data || []);
      } else {
        console.warn("Failed to fetch accounts:", res.data?.message);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  const login = (user) => {
    setUser(user);
    // load user's real accounts after login
    fetchAccounts(user);
  };

  const logout = () => {
    setUser(null);
  };

  // The Transfer page performs the API call itself. Here we only act as a
  // notifier/refresh: when Transfer reports success via `onTransfer`, simply
  // re-fetch accounts from the backend so the UI shows authoritative values.
  const transfer = async (_payload = {}) => {
    if (user) await fetchAccounts(user);
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
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
