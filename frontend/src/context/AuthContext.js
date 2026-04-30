import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Use relative path in production (nginx proxy) or fallback to env var
const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const TOKEN_STORAGE_KEYS = ['leadvibes_token', 'token'];
const USER_STORAGE_KEYS = ['leadvibes_user', 'user'];

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

const persistAuthSession = (accessToken, userData) => {
  TOKEN_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, accessToken));
  USER_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, JSON.stringify(userData)));
};

const clearAuthSession = () => {
  TOKEN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
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
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: API_URL ? `${API_URL}/api` : '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    const storedToken = readFirstStorageValue(TOKEN_STORAGE_KEYS);
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  });

  // Handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      const payload = response.data?.user ? response.data : { user: response.data };
      setUser(mergeSessionUser(payload.user, payload));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user: userData, active_workspace, available_workspaces } = response.data;
    const sessionUser = mergeSessionUser(userData, { active_workspace, available_workspaces });
    persistAuthSession(access_token, sessionUser);
    setToken(access_token);
    setUser(sessionUser);
    return sessionUser;
  };

  const register = async (name, email, password, role = 'broker', account_type = 'individual') => {
    const response = await api.post('/auth/register', { name, email, password, role, account_type });
    const { access_token, user: userData, active_workspace, available_workspaces } = response.data;
    const sessionUser = mergeSessionUser(userData, { active_workspace, available_workspaces });
    persistAuthSession(access_token, sessionUser);
    setToken(access_token);
    setUser(sessionUser);
    return sessionUser;
  };

  const switchWorkspace = async (tenantId) => {
    const response = await api.post('/auth/switch-workspace', { tenant_id: tenantId });
    const { access_token, user: userData, active_workspace, available_workspaces } = response.data;
    const sessionUser = mergeSessionUser(userData, { active_workspace, available_workspaces });
    persistAuthSession(access_token, sessionUser);
    setToken(access_token);
    setUser(sessionUser);
    return sessionUser;
  };

  const logout = () => {
    clearAuthSession();
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Helper to check if user is individual
  const isIndividual = user?.account_type === 'individual';
  const isAgency = user?.account_type === 'agency';

  const value = {
    user,
    token,
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
