import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function Verify() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email || !otp) {
      setMessage("Please enter both email and code");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/verify-email", { email, otp });
      if (res.data && res.data.success) {
        setMessage(res.data.message || "Verified successfully");
        // optionally redirect to login
        setTimeout(() => navigate("/login"), 900);
      } else {
        setMessage(res.data?.message || "Verification failed");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Error verifying");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setMessage("");
    if (!email) {
      setMessage("Please enter the email to resend the code");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/resend-token", { email });
      if (res.data && res.data.success) {
        setMessage(res.data.message || "OTP resent successfully");
      } else {
        setMessage(res.data?.message || "Failed to resend OTP");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Error resending OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 gap-6 bg-white">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Verify your email</h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          {message && <div className="text-sm text-red-600">{message}</div>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-gray-800 bg-gray-100 hover:bg-gray-200`}
            >
              Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
