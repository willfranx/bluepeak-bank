import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { auth, setAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  // form states
  const [newName, setNewName] = useState("");
  const [nameStatus, setNameStatus] = useState(null);

  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState(null);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStatus, setDeleteStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth?.accessToken) return;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile", {
          // `api` already attaches token and credentials via interceptors
          withCredentials: true,
        });
        setProfile(res.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, [auth]);

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-8">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full text-white">
          <h2 className="text-xl font-semibold mb-2">Loading profile…</h2>
          <p className="text-sm text-gray-300">Fetching account details</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 gap-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-xl w-full text-white">
        <h2 className="text-2xl font-bold mb-4">Your Profile</h2>

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
                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white text-sm"
                onClick={() => {
                  setEditing(!editing);
                  // reset statuses when toggling
                  setNameStatus(null);
                  setEmailStatus(null);
                  setPasswordStatus(null);
                  setDeleteStatus(null);
                }}
              >
                {editing ? "Close Editor" : "Edit Profile"}
              </button>
            </div>
          </div>

          {editing && (
            <div className="mt-4 bg-gray-900 rounded-md p-4 space-y-4">
              {/* Update name */}
              <div>
                <h3 className="text-sm text-gray-300 mb-2">Update Name</h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 p-2 rounded bg-gray-800 text-white text-sm"
                    placeholder="New name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-white text-sm"
                    onClick={async () => {
                      setNameStatus(null);
                      try {
                        const res = await api.post("/auth/updateName", {
                          userid: auth.userid,
                          newName,
                        });
                        if (res.data?.success) {
                          setProfile((p) => ({ ...p, name: newName }));
                          setAuth((a) => (a ? { ...a, name: newName } : a));
                          setNameStatus({ ok: true, msg: res.data.message });
                          setNewName("");
                        } else {
                          setNameStatus({ ok: false, msg: res.data.message || "Update failed" });
                        }
                      } catch (err) {
                        console.error(err);
                        setNameStatus({ ok: false, msg: err?.response?.data?.message || "Server error" });
                      }
                    }}
                    disabled={!newName.trim()}
                  >
                    Save
                  </button>
                </div>
                {nameStatus && (
                  <p className={`mt-2 text-sm ${nameStatus.ok ? "text-green-400" : "text-red-400"}`}>
                    {nameStatus.msg}
                  </p>
                )}
              </div>

              {/* Update email (requires current password) */}
              <div>
                <h3 className="text-sm text-gray-300 mb-2">Update Email</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input className="p-2 rounded bg-gray-800 text-white text-sm" value={auth.email} readOnly />
                  <input
                    className="p-2 rounded bg-gray-800 text-white text-sm"
                    placeholder="Current password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    type="password"
                  />
                  <input
                    className="p-2 rounded bg-gray-800 text-white text-sm"
                    placeholder="New email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    type="email"
                  />
                </div>
                <div className="mt-2">
                  <button
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-white text-sm"
                    onClick={async () => {
                      setEmailStatus(null);
                      try {
                        const res = await api.post("/auth/updateEmail", {
                          email: auth.email,
                          password: emailPassword,
                          newEmail,
                        });
                        if (res.data?.success) {
                          // backend issues OTP to new email; redirect to verify page so user can complete verification
                          setEmailStatus({ ok: true, msg: res.data.message || "OTP sent to new email" });
                          // navigate to verify page and prefill the email field (mark as newemail flow)
                          navigate("/verify", { state: { email: newEmail, mode: "newemail" } });
                          setEmailPassword("");
                          setNewEmail("");
                        } else {
                          setEmailStatus({ ok: false, msg: res.data.message || "Update failed" });
                        }
                      } catch (err) {
                        console.error(err);
                        setEmailStatus({ ok: false, msg: err?.response?.data?.message || "Server error" });
                      }
                    }}
                    disabled={!emailPassword || !newEmail}
                  >
                    Send OTP
                  </button>
                </div>
                {emailStatus && (
                  <p className={`mt-2 text-sm ${emailStatus.ok ? "text-green-400" : "text-red-400"}`}>
                    {emailStatus.msg}
                  </p>
                )}
              </div>

              {/* Update password */}
              <div>
                <h3 className="text-sm text-gray-300 mb-2">Update Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className="p-2 rounded bg-gray-800 text-white text-sm"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type="password"
                  />
                  <input
                    className="p-2 rounded bg-gray-800 text-white text-sm md:col-span-2"
                    placeholder="New password (min 12 chars, complex)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                  />
                </div>
                <div className="mt-2">
                  <button
                    className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-white text-sm"
                    onClick={async () => {
                      setPasswordStatus(null);
                      try {
                        const res = await api.post("/auth/updatePassword", {
                          email: auth.email,
                          password: currentPassword,
                          newPassword,
                        });
                        if (res.data?.success) {
                          setPasswordStatus({ ok: true, msg: res.data.message || "Password updated" });
                          setCurrentPassword("");
                          setNewPassword("");
                        } else {
                          setPasswordStatus({ ok: false, msg: res.data.message || "Update failed" });
                        }
                      } catch (err) {
                        console.error(err);
                        setPasswordStatus({ ok: false, msg: err?.response?.data?.message || "Server error" });
                      }
                    }}
                    disabled={!currentPassword || !newPassword}
                  >
                    Update Password
                  </button>
                </div>
                {passwordStatus && (
                  <p className={`mt-2 text-sm ${passwordStatus.ok ? "text-green-400" : "text-red-400"}`}>
                    {passwordStatus.msg}
                  </p>
                )}
              </div>

              {/* Delete account */}
              <div>
                <h3 className="text-sm text-gray-300 mb-2">Delete Account</h3>
                <p className="text-xs text-gray-400">This will permanently delete your account and data.</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className="p-2 rounded bg-gray-800 text-white text-sm"
                    placeholder="Current password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    type="password"
                  />
                  <button
                    className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-white text-sm"
                    onClick={async () => {
                      setDeleteStatus(null);
                      const confirmed = window.confirm(
                        "Are you sure you want to permanently delete your account? This action cannot be undone."
                      );
                      if (!confirmed) return;
                      try {
                        const res = await api.post("/auth/deleteUser", {
                          email: auth.email,
                          password: deletePassword,
                        }, { withCredentials: true });
                        if (res.data?.success) {
                          setDeleteStatus({ ok: true, msg: res.data.message || "Account deleted" });
                          // clear auth and redirect to home/login
                          setAuth(null);
                          window.location.href = "/";
                        } else {
                          setDeleteStatus({ ok: false, msg: res.data.message || "Delete failed" });
                        }
                      } catch (err) {
                        console.error(err);
                        setDeleteStatus({ ok: false, msg: err?.response?.data?.message || "Server error" });
                      }
                    }}
                    disabled={!deletePassword}
                  >
                    Delete Account
                  </button>
                </div>
                {deleteStatus && (
                  <p className={`mt-2 text-sm ${deleteStatus.ok ? "text-green-400" : "text-red-400"}`}>
                    {deleteStatus.msg}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;