import React, { useState } from "react";
import logoLarge from "../assets/logo-large.png";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const submit = async (e) => {
  e.preventDefault();
  setError("");
  if (!email || !password) {
    setError("Please enter username and password");
    return;
  }

  try {
    const payload = { email, password };
    const res = await api.post("/auth/login", payload, { withCredentials: true });
    const body = res.data;
    const user = body.data; 

    if (!user) {
      setError(body.message || "Login failed");
      return;
    }

    onLogin(user);
    navigate("/accounts");

  } catch (err) {
    if (err.response) {
      setError(
        err.response.data?.message || `Login failed (${err.response.status})`
      );
    } else if (err.request) {
      setError("No response from server");
    } else {
      setError(err.message || "Login error");
    }
  }
};


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-8 gap-4">
      <div className="p-4 flex items-center justify-center">
        <h1 className="text-2xl text-gray-900">Welcome to BluePeak Bank!</h1>
      </div>

      <div className="p-4 flex items-center justify-center">
        <img className="h-40 w-auto" src={logoLarge} alt="Bluepeak bank logo" />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Sign in to view your account
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">Don't have an account? </span>
          <button onClick={() => navigate('/signup')} className="text-blue-600 hover:underline">Create one</button>
        </div>
      </div>
    </div>
  );
}
