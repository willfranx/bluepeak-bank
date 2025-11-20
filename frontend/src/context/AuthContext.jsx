import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useCallback } from "react";

// Function to store users globally data and access token 
// We can use it across the whole app without passing props manually 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh access token using refresh cookie
  const refreshAccessToken = useCallback(async () => {
    try {
        const res = await api.post(
          "/auth/refresh-token",
          {}, // no body needed
          { withCredentials: true } // send HTTP-only cookie
        );

      if (res.data.success && res.data.data?.accessToken) {
        const { accessToken, userid, name, email } = res.data.data;
        setAuth({ accessToken, userid, name, email });
        return accessToken;
      } else {
        setAuth(null);
        return null;
      }
    } catch (err) {
      console.error("Refresh token failed:", err);
      setAuth(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial check on app load
  useEffect(() => {
    refreshAccessToken();
  }, [refreshAccessToken]);

  // Automatic token refresh every 50 seconds (if access token is 1 min)
  useEffect(() => {
    const interval = setInterval(() => {
      if (auth?.accessToken) {
        refreshAccessToken();
      }
      // refresh before 1-min expiry
    }, 50 * 1000); 

    return () => clearInterval(interval);
  }, [auth?.accessToken, refreshAccessToken]);

  // Sync Authorization header on the shared `api` instance whenever auth changes
  useEffect(() => {
    if (auth?.accessToken) {
      api.defaults.headers.common.Authorization = `Bearer ${auth.accessToken}`;
    } else {
      // remove header when not authenticated
      if (api.defaults.headers.common?.Authorization) {
        delete api.defaults.headers.common.Authorization;
      }
    }
  }, [auth]);

  // Helper to clear auth and remove Authorization header
  const clearAuth = () => {
    setAuth(null);
    if (api.defaults.headers.common?.Authorization) delete api.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading, refreshAccessToken, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);