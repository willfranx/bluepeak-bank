import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import logoLarge from "../assets/logo-large.png";

const Login = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", form, {
        withCredentials: true, // important: send/receive cookies
      });

      if (res.data.success) {
        // Only store the access token in memory
        setAuth({
          accessToken: res.data.data.accessToken,
          userid: res.data.data.userid,
          name: res.data.data.name,
          email: res.data.data.email,
        });
        navigate("/accounts");
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded">
      <div className="p-4 flex items-center justify-center">
        <h1 className="text-2xl text-gray-900">Welcome to BluePeak Bank!</h1>
      </div>

      <div className="p-4 flex items-center justify-center">
        <img className="h-40 w-auto" src={logoLarge} alt="Bluepeak bank logo" />
      </div>

      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Login
        </button>
      </form>
      <div className="mt-4 text-sm text-center">
          <span className="text-gray-600">Don't have an account? </span>
          <button onClick={() => navigate('/signup')} className="text-blue-600 hover:underline">Create one</button>
      </div>
    </div>
  );
};

export default Login;