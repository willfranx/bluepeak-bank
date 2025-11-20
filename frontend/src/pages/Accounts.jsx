import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Accounts() {
  const { loading } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;

    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      setError("");
      try {
        const res = await api.get(`/accounts`, { withCredentials: true });
        if (res.data && res.data.success) setAccounts(res.data.data || []);
        else setError(res.data?.message || "Failed to load accounts");
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Error fetching accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [loading]);

  const isLoading = loading || loadingAccounts;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 py-8 gap-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-white mb-4">Your Accounts</h2>

        {isLoading ? (
          <div className="text-sm text-gray-300">Loading accounts…</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : accounts.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">No accounts to display.</div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {accounts.map((a) => (
              <li key={a.accountid} className="py-3 flex items-center justify-between">
                <div className="text-gray-200">{a.type || `Account ${a.accountid}`}</div>
                <div className="text-white font-medium">${Number(a.balance || 0).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
