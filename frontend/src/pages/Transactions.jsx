import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";

export default function Transactions({ accounts = [] }) {
  const { auth, loading } = useAuth();
  const [accountsState, setAccountsState] = useState(accounts || []);
  const [accountId, setAccountId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [error, setError] = useState("");

  // Fetch accounts when auth is ready
  useEffect(() => {
    if (loading) return;
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const res = await api.get(`/accounts`);
        if (res.data && res.data.success) {
          const list = res.data.data || [];
          setAccountsState(list);
          if (!accountId && list.length) setAccountId(list[0].accountid || list[0].id || "");
        }
      } catch (err) {
        console.error("Failed to fetch accounts for transactions:", err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [loading]);

  // Fetch transactions when accountId is selected
  useEffect(() => {
    if (loading) return;
    if (!accountId) return;

    const fetchTransactions = async () => {
      setLoadingTx(true);
      setError("");
      try {
        const res = await api.get(`/transactions`, { withCredentials: true });
        if (res.data && res.data.success) {
          const all = res.data.data || [];
          const filtered = all.filter(
            (t) => String(t.srcid) === String(accountId) || String(t.desid) === String(accountId)
          );
          setTransactions(filtered);
        } else {
          setError(res.data?.message || "Failed to load transactions");
          setTransactions([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Error");
        setTransactions([]);
      } finally {
        setLoadingTx(false);
      }
    };

    fetchTransactions();
  }, [accountId, loading]);

  // Helpers for display
  const formatTime = (t) => {
    const timeVal = t?.completetime || t?.created || t?.approvedtime;
    if (!timeVal) return "-";
    try {
      return new Date(timeVal).toLocaleString();
    } catch (e) {
      return String(timeVal);
    }
  };

  const capitalize = (s) => {
    if (!s && s !== "") return "-";
    const str = String(s || "").trim();
    if (!str) return "-";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading || loadingAccounts) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!auth) {
    return <div className="min-h-screen flex items-center justify-center">Please sign in to view transactions.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 gap-6 bg-white">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-3xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Transactions</h2>
          <div>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="px-3 py-2 rounded-md bg-gray-900 text-gray-100"
            >
              {accountsState.map((a) => (
                <option key={a.accountid || a.id} value={a.accountid || a.id}>
                  {a.type || `Account ${a.accountid || a.id}`} (${Number(a.balance || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingTx ? (
          <div className="text-sm text-gray-300">Loading…</div>
        ) : error ? (
          <ErrorMessage message={error} className="text-sm text-red-400" />
        ) : (
          <table className="w-full text-left text-sm text-gray-200">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2">Time</th>
                <th className="py-2">Type</th>
                <th className="py-2">Source</th>
                <th className="py-2">Destination</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    No transactions for this account.
                  </td>
                </tr>
              )}

              {transactions.map((t) => {
                const srcAcc = accountsState.find((a) => String(a.accountid || a.id) === String(t.srcid));
                const desAcc = accountsState.find((a) => String(a.accountid || a.id) === String(t.desid));
                const srcType = t.src_type || (srcAcc && srcAcc.type) || "-";
                const desType = t.des_type || (desAcc && desAcc.type) || "-";
                const SYS_ID = 1;
                const srcLabel = Number(t.srcid) === SYS_ID ? capitalize(t.type) : capitalize(srcType);
                const desLabel = Number(t.desid) === SYS_ID ? capitalize(t.type) : capitalize(desType);
                return (
                  <tr key={t.transactionid} className="border-b border-gray-700">
                    <td className="py-2">{formatTime(t)}</td>
                    <td className="py-2">{capitalize(t.type)}</td>
                    <td className="py-2">{srcLabel}</td>
                    <td className="py-2">{desLabel}</td>
                    <td className="py-2">${Number(t.amount).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
