import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Accounts() {
  const { loading, auth } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState("checking");
  const [addBalance, setAddBalance] = useState(0);
  const [adding, setAdding] = useState(false);

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
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-3xl w-full">
        <h2 className="text-2xl font-semibold text-white mb-4">Your Accounts</h2>

        {isLoading ? (
          <div className="text-sm text-gray-300">Loading accounts…</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : accounts.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">No accounts to display.</div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Accounts</h3>
              <div>
                <button
                  className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-white text-sm"
                  onClick={() => setShowAdd((s) => !s)}
                >
                  {showAdd ? "Cancel" : "Add Account"}
                </button>
              </div>
            </div>

            {showAdd && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMessage("");
                  const payload = {
                    userId: auth?.userId,
                    name: addName,
                    accountType: addType,
                    balance: Number(addBalance || 0),
                  };
                  try {
                    setAdding(true);
                    // include userid if backend requires it, otherwise server will use req.user
                    if (payload.userId === undefined) delete payload.userId;
                    const res = await api.post(`/accounts`, payload);
                    if (res.data && res.data.success) {
                      setMessage("Account created");
                      setAddName("");
                      setAddBalance(0);
                      setShowAdd(false);
                      const r = await api.get(`/accounts`);
                      if (r.data && r.data.success) setAccounts(r.data.data || []);
                    } else {
                      setMessage(res.data?.message || "Failed to create account");
                    }
                  } catch (err) {
                    setMessage(err.response?.data?.message || err.message || "Error creating account");
                  } finally {
                    setAdding(false);
                  }
                }}
                className="mb-3 space-y-2"
              >
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Account name"
                  className="w-full px-3 py-2 rounded bg-gray-900 text-gray-100"
                  required
                />
                <div className="flex gap-2">
                  <select value={addType} onChange={(e) => setAddType(e.target.value)} className="px-3 py-2 rounded bg-gray-900 text-gray-100">
                    <option value="checking">Checking</option>
                    <option value="saving">Saving</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={addBalance}
                    onChange={(e) => setAddBalance(e.target.value)}
                    placeholder="Starting balance"
                    className="flex-1 px-3 py-2 rounded bg-gray-900 text-gray-100"
                  />
                </div>
                <div>
                  <button disabled={adding} className="px-3 py-2 bg-blue-600 rounded text-white">
                    {adding ? "Adding…" : "Create Account"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-3 bg-gray-900 rounded">
              <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm text-gray-400 border-b border-gray-700">
                <div>Type</div>
                <div>Name</div>
                <div className="text-right">Balance</div>
              </div>

              <ul>
                {accounts.map((a) => (
                  <li key={a.accountid} className="grid grid-cols-3 gap-4 items-center px-4 py-3 hover:bg-gray-800">
                    <div className="text-gray-200">{a.type || `Account ${a.accountid}`}</div>
                    <div className="text-gray-200">{a.name || `Account ${a.accountid}`}</div>
                    <div className="flex items-center justify-end gap-3">
                      <div className="text-white font-medium">${Number(a.balance || 0).toFixed(2)}</div>
                      <button
                        className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-white text-sm"
                        onClick={async () => {
                          setMessage("");
                          const confirmed = window.confirm("Are you sure you want to delete your account? All account balances must be zero first.");
                          if (!confirmed) return;
                          try {
                            setDeleting(a.accountid);
                            const res = await api.delete(`/accounts/${a.accountid}`);
                            if (res.data && res.data.success) {
                              setMessage("Account deleted successfully");
                              const r = await api.get(`/accounts`);
                              if (r.data && r.data.success) setAccounts(r.data.data || []);
                            } else {
                              setMessage(res.data?.message || "Failed to delete account");
                            }
                          } catch (err) {
                            setMessage(err.response?.data?.message || err.message || "Error deleting account");
                          } finally {
                            setDeleting(null);
                          }
                        }}
                        disabled={deleting === a.accountid}
                      >
                        {deleting === a.accountid ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {message && <div className="mt-3 text-sm text-yellow-200">{message}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
