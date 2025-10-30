import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function NavBar({ user, onLogout }) {
  return (
    <nav className="border-b bg-sky-600">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center">
        <img
          className="rounded-full h-8 w-auto mr-4"
          src={logo}
          alt="Bluepeak bank logo"
        />

        <Link to="/" className="flex items-center space-x-3">
          <span className="text-lg font-semibold text-white hover:text-blue-700">
            BluePeak Bank
          </span>
        </Link>

        <div className="flex-1 flex justify-center gap-6">
          <Link
            to="/accounts"
            className="flex flex-col items-center text-neutral-50 hover:text-blue-600 transition-colors"
            aria-label="Accounts"
          >
            {/* simple user icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="text-sm">Accounts</span>
          </Link>

          <Link
            to="/transfer"
            className="flex flex-col items-center text-neutral-50 hover:text-blue-600 transition-colors"
            aria-label="Transfer"
          >
            {/* simple transfer icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7h16M4 12h10m-6 5h6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-3-3m3 3l-3 3"
              />
            </svg>
            <span className="text-sm">Transfer</span>
          </Link>
        </div>

        {/* Right: auth actions */}
        <div className="flex items-center gap-3 text-neutral-50">
          {user ? (
            <>
              <span className="text-gray-200">
                Hi, {user.name || "there"}
              </span>
              <button
                onClick={onLogout}
                className="px-3 py-1 text-white rounded-md bg-gray-700 hover:text-blue-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1 text-white hover:text-blue-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
