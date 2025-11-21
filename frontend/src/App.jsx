import React from "react";
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
import Verify from "./pages/Verify";

import NavBar from "./components/NavBar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";

function HomeRedirect() {
  const { auth, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  // If we have a signed-in user, go to accounts, otherwise go to login
  const signedIn = !!(auth && (auth.userId || auth.userid || auth.accessToken));
  return <Navigate to={signedIn ? "/accounts" : "/login"} replace />;
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify" element={<Verify />} />

          <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
export default App;