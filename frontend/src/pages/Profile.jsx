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

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Welcome, {profile.name}</h2>
      <p>Email: {profile.email}</p>
      <p>UserID: {profile.userid}</p>
    </div>
  );
};

export default Profile;