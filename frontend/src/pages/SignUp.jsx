import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function SignUp({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const payload = { name, email, password };
      const res = await api.post("/auth/register", payload);
      const body = res.data;
      // backend returns the created user under `data` (secure controller) or `user` (insecure)
      if (body && body.success) {
        const user = body.user || body.data;
        if (!user) {
          setError("Registration succeeded but no user info returned");
          return;
        }

        // Notify parent (login) and pass any created accounts returned by the server
        const createdAccounts = body.accounts || [];
        if (typeof onLogin === "function") onLogin(user, createdAccounts);

        // Navigate to accounts page
        navigate("/accounts");
      } else {
        setError(body?.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Sign up error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-8 gap-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create an account</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="you@example.com"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Password"
              type="password"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">Already have an account? </span>
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">Sign in</button>
        </div>
      </div>
    </div>
  );
}
