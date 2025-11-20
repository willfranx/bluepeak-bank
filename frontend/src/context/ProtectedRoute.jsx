import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { auth, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // wait for refresh check

  // If user is not authenticated, redirect to login
  if (!auth?.accessToken) return <Navigate to="/login" />;

  // Otherwise, render the protected component
  return children;
}