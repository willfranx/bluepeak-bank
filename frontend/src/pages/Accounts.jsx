import React from "react";

export default function Accounts({ accounts = [] }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 py-8 gap-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-white mb-4">
          Your Accounts
        </h2>

        <ul className="divide-y divide-gray-700">
          {accounts.map((a) => (
            <li key={a.id} className="py-3 flex items-center justify-between">
              <div className="text-gray-200">{a.name}</div>
              <div className="text-white font-medium">
                ${a.balance.toFixed(2)}
              </div>
            </li>
          ))}
          {accounts.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-500">
              No accounts to display.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
