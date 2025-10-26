import React, { useState } from "react";
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

function App() {
  // Basic in-memory auth and accounts state for demo purposes
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([
    { id: "chk-1", name: "Checking", balance: 1250.5 },
    { id: "sav-1", name: "Savings", balance: 8400.0 },
  ]);

  const login = (username) => {
    setUser({ username });
  };

  const logout = () => {
    setUser(null);
  };

  const transfer = ({ fromId, toId, amount }) => {
    // Simple transfer: find accounts and update balances
    setAccounts((prev) => {
      const copy = prev.map((a) => ({ ...a }));
      const from = copy.find((a) => a.id === fromId);
      const to = copy.find((a) => a.id === toId);
      const num = Number(amount) || 0;
      if (!from || !to || num <= 0) return prev;
      if (from.balance < num) return prev; // no overdraft
      from.balance -= num;
      to.balance += num;
      return copy;
    });
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
                  <Accounts accounts={accounts} />
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
