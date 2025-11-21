import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { auth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

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
              <button className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white text-sm">Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;