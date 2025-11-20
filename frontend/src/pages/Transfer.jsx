import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Transfer({ accounts = [], onTransfer }) {
  const { loading } = useAuth();
  const [accountsState, setAccountsState] = useState(accounts || []);

  const [action, setAction] = useState("transfer"); // transfer, deposit, withdraw
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFromId("");
    setToId("");
    setRecipientEmail("");
  }, [accountsState]);

  useEffect(() => {
    if (loading) return;
    const fetchAccounts = async () => {
      try {
        const res = await api.get(`/accounts`);
        if (res.data && res.data.success) {
          setAccountsState(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch accounts for Transfer:", err);
      }
    };

    if (!accounts || accounts.length === 0) fetchAccounts();
  }, [loading]);

  const send = async (e) => {
    e.preventDefault();
    setMessage("");

    const num = Number(amount);
    if (!num || num <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }

    if (action === "transfer") {
      if (!fromId || !toId) {
        setMessage("Please pick source and destination accounts");
        return;
      }
      if (String(fromId) === String(toId)) {
        setMessage("Cannot transfer to the same account");
        return;
      }
      const from = accountsState.find((a) => String(a.accountid) === String(fromId));
      if (!from || Number(from.balance) < num) {
        setMessage("Insufficient funds");
        return;
      }
    }

    if (action === "deposit" && !toId) {
      setMessage("Please pick a destination account");
      return;
    }

    if (action === "withdraw") {
      if (!fromId) {
        setMessage("Please pick a source account");
        return;
      }
      const from = accountsState.find((a) => String(a.accountid) === String(fromId));
      if (!from || Number(from.balance) < num) {
        setMessage("Insufficient funds");
        return;
      }
    }

    if (action === 'transfer-user') {
      if (!fromId || !recipientEmail) {
        setMessage('Please pick a source account and enter recipient email');
        return;
      }
      const from = accountsState.find((a) => String(a.accountid) === String(fromId));
      if (!from || Number(from.balance) < num) {
        setMessage('Insufficient funds');
        return;
      }
      const email = recipientEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setMessage('Please enter a valid recipient email');
        return;
      }
    }

    try {
      setSubmitting(true);

      if (action === "transfer") {
        const payload = { srcId: Number(fromId), desId: Number(toId), amount: num };
        const res = await api.post(`/transactions/transfer`, payload);
        if (res.data && res.data.success) {
          setMessage("Transfer complete");
          setAmount("");
          setFromId("");
          setToId("");
          if (typeof onTransfer === "function") onTransfer({ type: 'transfer', fromId: Number(fromId), toId: Number(toId), amount: num });
        } else {
          setMessage(res.data?.message || "Transfer failed");
        }

      } else if (action === "deposit") {
        const payload = { accountId: Number(toId), amount: num };
        const res = await api.post(`/transactions/deposit`, payload);
        if (res.data && res.data.success) {
          setMessage("Deposit complete");
          setAmount("");
          setToId("");
          if (typeof onTransfer === "function") onTransfer({ type: 'deposit', accountId: Number(toId), amount: num });
        } else {
          setMessage(res.data?.message || "Deposit failed");
        }

      } else if (action === "withdraw") {
        const payload = { accountId: Number(fromId), amount: num };
        const res = await api.post(`/transactions/withdraw`, payload);
        if (res.data && res.data.success) {
          setMessage("Withdrawal complete");
          setAmount("");
          setFromId("");
          if (typeof onTransfer === "function") onTransfer({ type: 'withdraw', accountId: Number(fromId), amount: num });
        } else {
          setMessage(res.data?.message || "Withdraw failed");
        }

      } else if (action === 'transfer-user') {
        const email = recipientEmail.trim();
        const payload = { srcid: Number(fromId), toUserEmail: email, amount: num };
        const res = await api.post(`/transactions/insecure/transfer-to-user`, payload);
        if (res.data && res.data.success) {
          setMessage('Transfer to user complete');
          setAmount('');
          setFromId("");
          setRecipientEmail('');
          if (typeof onTransfer === 'function') onTransfer({ type: 'transfer-user', fromId: Number(fromId), toUserEmail: email, amount: num });
        } else {
          setMessage(res.data?.message || 'Transfer failed');
        }
      }

    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Transaction error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-8">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-white mb-4">
          Account Actions
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-1">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100"
          >
            <option value="transfer">Transfer between accounts</option>
            <option value="transfer-user">Transfer to another user</option>
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
        </div>

        <form onSubmit={send} className="space-y-4">
          {(action === 'transfer' || action === 'withdraw' || action === 'transfer-user') && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">From</label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100"
              >
                <option value="">-- select account --</option>
                {accountsState.map((a) => {
                  const id = a.accountid;
                  const label = a.type || `Account ${id}`;
                  return (
                    <option key={id} value={id}>{label} (${Number(a.balance || 0).toFixed(2)})</option>
                  );
                })}
              </select>
            </div>
          )}

          {(action === 'transfer' || action === 'deposit') && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">To</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100"
              >
                <option value="">-- select account --</option>
                {accountsState.map((a) => {
                  const id = a.accountid;
                  const label = a.type || `Account ${id}`;
                  return (
                    <option key={id} value={id}>{label} (${Number(a.balance || 0).toFixed(2)})</option>
                  );
                })}
              </select>
            </div>
          )}

          {action === 'transfer-user' && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Recipient email</label>
              <input
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100"
              />
              <p className="text-xs text-gray-400 mt-1">Enter the recipient's email to transfer to one of their accounts.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100"
            />
          </div>

          <div>
              <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              type="submit"
                disabled={submitting}
            >
              {submitting
                ? "Processing…"
                : action === 'transfer'
                ? 'Send Transfer'
                : action === 'transfer-user'
                ? 'Send Transfer (to user)'
                : action === 'deposit'
                ? 'Make Deposit'
                : 'Withdraw'}
            </button>
          </div>
        </form>
        {message && <p className="mt-4 text-sm text-gray-300">{message}</p>}
      </div>
    </div>
  );
}
