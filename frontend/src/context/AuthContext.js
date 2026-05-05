import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { canAccessCopim, isCopimAccount, resolveAppModeForUser } from '../lib/copimAccess';

// Use relative path in production (nginx proxy) or fallback to env var
const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const TOKEN_STORAGE_KEYS = ['leadvibes_token', 'token'];
const REFRESH_TOKEN_STORAGE_KEYS = ['leadvibes_refresh_token', 'refresh_token'];
const USER_STORAGE_KEYS = ['leadvibes_user', 'user'];
const APP_MODE_STORAGE_KEY = 'leadvibes_app_mode';

const AuthContext = createContext(null);

const readFirstStorageValue = (keys) => {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) {
      return value;
    }
  }
  return null;
};

const readStoredUser = () => {
  const raw = readFirstStorageValue(USER_STORAGE_KEYS);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse stored user:', error);
    return null;
  }
};

const readStoredAppMode = () => {
  const raw = localStorage.getItem(APP_MODE_STORAGE_KEY);
  return raw === 'copim' ? 'copim' : 'rovi';
};

const persistAppMode = (mode) => {
  localStorage.setItem(APP_MODE_STORAGE_KEY, mode === 'copim' ? 'copim' : 'rovi');
};

const persistRefreshToken = (refreshToken) => {
  if (typeof refreshToken === 'string' && refreshToken.trim()) {
    REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, refreshToken));
    return;
  }

  if (refreshToken === null) {
    REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }
};

const persistAuthSession = (accessToken, userData, refreshToken) => {
  TOKEN_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, accessToken));
  USER_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, JSON.stringify(userData)));
  if (refreshToken !== undefined) {
    persistRefreshToken(refreshToken);
  }
};

const clearAuthSession = () => {
  TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  USER_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

const mergeSessionUser = (userData, sessionData = {}) => ({
  ...(userData || {}),
  active_workspace: sessionData.active_workspace || userData?.active_workspace || null,
  available_workspaces: sessionData.available_workspaces || userData?.available_workspaces || [],
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => readFirstStorageValue(TOKEN_STORAGE_KEYS));
  const [refreshToken, setRefreshToken] = useState(() => readFirstStorageValue(REFRESH_TOKEN_STORAGE_KEYS));
  const [appMode, setAppModeState] = useState(() => readStoredAppMode());
  const [loading, setLoading] = useState(true);
  const refreshPromiseRef = useRef(null);

  const apiBaseUrl = useMemo(() => (API_URL ? `${API_URL}/api` : '/api'), []);
  const api = useMemo(() => axios.create({
    baseURL: apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  }), [apiBaseUrl]);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const completeSessionUpdate = useCallback((payload) => {
    const sessionUser = mergeSessionUser(payload.user, {
      active_workspace: payload.active_workspace,
      available_workspaces: payload.available_workspaces,
    });
    const nextAppMode = resolveAppModeForUser(sessionUser, readStoredAppMode());
    persistAuthSession(payload.access_token, sessionUser, payload.refresh_token);
    persistAppMode(nextAppMode);
    setToken(payload.access_token);
    if (payload.refresh_token) {
      setRefreshToken(payload.refresh_token);
    }
    setAppModeState(nextAppMode);
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const refreshAccessSession = useCallback(async () => {
    const storedRefreshToken = readFirstStorageValue(REFRESH_TOKEN_STORAGE_KEYS);
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${apiBaseUrl}/auth/refresh`, {
      refresh_token: storedRefreshToken,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    completeSessionUpdate(response.data);
    return response.data.access_token;
  }, [apiBaseUrl, completeSessionUpdate]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      const storedToken = readFirstStorageValue(TOKEN_STORAGE_KEYS);
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {};
        const isAuthRoute = typeof originalRequest.url === 'string' && (
          originalRequest.url.includes('/auth/login') ||
          originalRequest.url.includes('/auth/register') ||
          originalRequest.url.includes('/auth/refresh')
        );

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
          originalRequest._retry = true;

          try {
            if (!refreshPromiseRef.current) {
              refreshPromiseRef.current = refreshAccessSession()
                .finally(() => {
                  refreshPromiseRef.current = null;
                });
            }

            const newAccessToken = await refreshPromiseRef.current;
            originalRequest.headers = {
              ...(originalRequest.headers || {}),
              Authorization: `Bearer ${newAccessToken}`,
            };
            return api(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }

        if (error.response?.status === 401 && isAuthRoute) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, logout, refreshAccessSession]);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      const payload = response.data?.user ? response.data : { user: response.data };
      const sessionUser = mergeSessionUser(payload.user, payload);
      const nextAppMode = resolveAppModeForUser(sessionUser, readStoredAppMode());
      persistAppMode(nextAppMode);
      setAppModeState(nextAppMode);
      setUser(sessionUser);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [api, logout, token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return completeSessionUpdate(response.data);
  };

  const register = async (name, email, password, role = 'broker', account_type = 'individual') => {
    const response = await api.post('/auth/register', { name, email, password, role, account_type });
    return completeSessionUpdate(response.data);
  };

  const switchWorkspace = async (tenantId) => {
    const response = await api.post('/auth/switch-workspace', { tenant_id: tenantId });
    return completeSessionUpdate({
      ...response.data,
      refresh_token: readFirstStorageValue(REFRESH_TOKEN_STORAGE_KEYS),
    });
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const setAppMode = useCallback((mode) => {
    const nextMode = resolveAppModeForUser(user, mode);
    persistAppMode(nextMode);
    setAppModeState(nextMode);
  }, [user]);

  // Helper to check if user is individual
  const isIndividual = user?.account_type === 'individual';
  const isAgency = user?.account_type === 'agency';
  const hasCopimAccess = canAccessCopim(user);
  const isCopimUser = isCopimAccount(user);
  const isCopimMode = appMode === 'copim';

  const value = {
    user,
    token,
    refreshToken,
    loading,
    login,
    register,
    logout,
    updateUser,
    switchWorkspace,
    api,
    isAuthenticated: !!token && !!user,
    isIndividual,
    isAgency,
    hasCopimAccess,
    isCopimAccount: isCopimUser,
    appMode,
    setAppMode,
    isCopimMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
