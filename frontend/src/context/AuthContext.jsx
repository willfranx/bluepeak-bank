import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(null);

  // setter wrapper that updates a sync ref so interceptors can read token synchronously
  const setAuth = (value) => {
    setAuthState(value);
    tokenRef.current = value?.accessToken || null;
  };

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

        // Temporarily set tokenRef so subsequent requests use the refreshed token
        tokenRef.current = accessToken;

        // If the refresh response included user info, use it. Otherwise fetch profile.
        let finalUser = { userid, name, email };
        if (!name || !userid) {
          try {
            const profileRes = await api.get("/auth/profile", { withCredentials: true });
            if (profileRes.data && profileRes.data.success) {
              finalUser = {
                userid: profileRes.data.data.userid ?? userid,
                name: profileRes.data.data.name ?? name,
                email: profileRes.data.data.email ?? email,
              };
            }
          } catch (err) {
            // If fetching profile fails, continue with whatever data we have
            console.warn("Could not fetch profile after refresh:", err);
          }
        }

        setAuth({ accessToken, userid: finalUser.userid, name: finalUser.name, email: finalUser.email });
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
    }, 50 * 1000);

    return () => clearInterval(interval);
  }, [auth?.accessToken, refreshAccessToken]);

  // Install a single request interceptor which reads the latest token from `tokenRef`
  // This avoids races when auth changes and ensures each request picks up the current token.
  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use(
      (config) => {
        const token = tokenRef.current;
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers && config.headers.Authorization) {
          delete config.headers.Authorization;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
