import React, { useState } from "react";

export default function Transfer({ accounts = [], onTransfer }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || "");
  const [toId, setToId] = useState(accounts[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const send = (e) => {
    e.preventDefault();
    if (!fromId || !toId || Number(amount) <= 0) {
      setMessage("Please pick accounts and a valid amount");
      return;
    }
    if (fromId === toId) {
      setMessage("Cannot transfer to the same account");
      return;
    }
    const from = accounts.find((a) => a.id === fromId);
    if (!from || from.balance < Number(amount)) {
      setMessage("Insufficient funds");
      return;
    }
    onTransfer({ fromId, toId, amount: Number(amount) });
    setMessage("Transfer complete");
    setAmount("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-8">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-white mb-4">
          Transfer Funds
        </h2>
        <form onSubmit={send} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              From
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (${a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              To
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bbg-gray-900 text-gray-100"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (${a.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Amount
            </label>
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
            >
              Send
            </button>
          </div>
        </form>
        {message && (
          <p className="mt-4 text-sm text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
