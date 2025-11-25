import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import formatApiError from "../utils/formatApiError";
import ErrorMessage from "../components/ErrorMessage";

const Profile = () => {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [pwdMode, setPwdMode] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth?.accessToken) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile", {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
          withCredentials: true,
        });
        setProfile(res.data.data);
        setNameInput(res.data.data?.name || "");
        setEmailInput(res.data.data?.email || "");
      } catch (err) {
        console.error(err);
        setError(formatApiError(err));
      }
    };

    fetchProfile();
  }, [auth]);

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-8">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full text-white">
          <h2 className="text-xl font-semibold mb-2">Loading profile…</h2>
          <p className="text-sm text-gray-300">Fetching account details</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 gap-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full text-white">
        <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
        <ErrorMessage message={error} />

          <div className="space-y-3">
          <div className="flex justify-between bg-gray-900 rounded-md p-3">
            <span className="text-sm text-gray-300">User Name</span>
            <span className="text-sm">{profile.name}</span>
          </div>

          <div className="flex justify-between bg-gray-900 rounded-md p-3">
            <span className="text-sm text-gray-300">Email</span>
            <span className="text-sm">{profile.email}</span>
          </div>

          <div className="bg-gray-900 rounded-md p-3">
            <div className="mt-2 justify-center flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white text-sm"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setPwdMode(true)}
                className="px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-700 text-white text-sm"
              >
                Change Password
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm("Delete your account? This cannot be undone.")) return;
                    try {
                    setBusy(true);
                    const res = await api.delete("/auth/delete", { 
                      withCredentials: true,
                      headers: { Authorization: `Bearer ${auth?.accessToken}` }
                    });
                    if (res.data?.success) {
                      // clear local auth and redirect
                      setAuth(null);
                      window.location.href = "/";
                    } else {
                      setError(formatApiError(res));
                    }
                  } catch (err) {
                    console.error(err);
                    setError(formatApiError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-white text-sm"
              >
                Delete Account
              </button>
            </div>
          </div>

          {editMode && (
            <div className="mt-4 bg-gray-900 rounded-md p-4">
              <h3 className="text-lg font-semibold mb-2">Edit Profile</h3>
              <label className="block text-sm text-gray-300">Name</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white mb-2"
              />
              <label className="block text-sm text-gray-300">Email</label>
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white mb-2"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700 text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setBusy(true);
                      const res = await api.put(
                        "/auth/profile",
                        { name: nameInput, email: emailInput },
                        { withCredentials: true, headers: { Authorization: `Bearer ${auth?.accessToken}` } }
                      );
                      if (res.data?.success) {
                        setProfile((p) => ({ ...p, name: res.data.data.name, email: res.data.data.email }));
                        // update auth context (preserve accessToken)
                        setAuth(auth ? { ...auth, name: res.data.data.name, email: res.data.data.email } : auth);
                        setEditMode(false);

                        // If email changed, redirect to verify page and prefill email
                        if (res.data.data?.emailChanged) {
                          navigate("/verify", { state: { email: res.data.data.email } });
                          return;
                        }

                        setError(null);
                      } else {
                        setError(formatApiError(res));
                      }
                    } catch (err) {
                      console.error(err);
                      setError(formatApiError(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-white text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {pwdMode && (
            <div className="mt-4 bg-gray-900 rounded-md p-4">
              <h3 className="text-lg font-semibold mb-2">Change Password</h3>
              <label className="block text-sm text-gray-300">Current Password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white mb-2"
              />
              <label className="block text-sm text-gray-300">New Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white mb-2"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setPwdMode(false)}
                  className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700 text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setBusy(true);
                      const res = await api.post(
                        "/auth/updatePassword",
                        { email: profile.email, password: currentPwd, newPassword: newPwd },
                        { withCredentials: true, headers: { Authorization: `Bearer ${auth?.accessToken}` } }
                      );
                      if (res.data?.success) {
                        setPwdMode(false);
                        setCurrentPwd("");
                        setNewPwd("");
                        setError(null);
                      } else {
                        setError(formatApiError(res));
                      }
                    } catch (err) {
                      console.error(err);
                      setError(formatApiError(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-white text-sm"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;