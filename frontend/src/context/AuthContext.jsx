import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic fetch helper — picks the right token based on prefix
export async function apiFetch(path, options = {}, tokenKey = 'sf_token') {
  const token = localStorage.getItem(tokenKey);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { success: false, message: text || `HTTP ${res.status}` };
  }

  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// Convenience wrappers
export const userFetch    = (path, opts) => apiFetch(path, opts, 'sf_token');
export const companyFetch = (path, opts) => apiFetch(path, opts, 'sf_company_token');

export function AuthProvider({ children }) {
  // Seller state
  const [user,      setUser]      = useState(null);
  const [shipments, setShipments] = useState([]);
  // Courier company state
  const [company,   setCompany]   = useState(null);
  // Shared loading
  const [loading,   setLoading]   = useState(true);

  // Restore both sessions on mount
  useEffect(() => {
    const userToken    = localStorage.getItem('sf_token');
    const companyToken = localStorage.getItem('sf_company_token');

    const tasks = [];

    if (userToken) {
      tasks.push(
        userFetch('/auth/me')
          .then(d => setUser(d.data.user))
          .catch(() => localStorage.removeItem('sf_token'))
      );
    }
    if (companyToken) {
      tasks.push(
        companyFetch('/company/me')
          .then(d => setCompany(d.data.company))
          .catch(err => {
            // Only remove token on auth errors, not network errors
            if (err.message?.toLowerCase().includes('invalid') ||
                err.message?.toLowerCase().includes('expired') ||
                err.message?.toLowerCase().includes('not authenticated')) {
              localStorage.removeItem('sf_company_token');
            }
          })
      );
    }

    Promise.allSettled(tasks).finally(() => setLoading(false));
  }, []);

  // Load user shipments when user changes
  useEffect(() => {
    if (!user) { setShipments([]); return; }
    userFetch('/shipments')
      .then(d => setShipments(d.data || []))
      .catch(() => {});
  }, [user]);

  // ── Seller auth ──────────────────────────────────────────
  const loginUser = useCallback(async (email, password) => {
    const d = await userFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('sf_token', d.data.token);
    setUser(d.data.user);
    return d;
  }, []);

  const registerUser = useCallback(async (fields) => {
    const d = await userFetch('/auth/register', { method: 'POST', body: JSON.stringify(fields) });
    localStorage.setItem('sf_token', d.data.token);
    setUser(d.data.user);
    return d;
  }, []);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('sf_token');
    setUser(null);
    setShipments([]);
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const d = await userFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(fields) });
    setUser(d.data.user);
    return d;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return userFetch('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  }, []);

  const addShipment = useCallback(s => setShipments(prev => [s, ...prev]), []);

  const refreshShipments = useCallback(async () => {
    try { const d = await userFetch('/shipments'); setShipments(d.data || []); } catch {}
  }, []);

  // ── Company auth ─────────────────────────────────────────
  const loginCompany = useCallback(async (email, password) => {
    const d = await companyFetch('/company/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('sf_company_token', d.data.token);
    setCompany(d.data.company);
    return d;
  }, []);

  const registerCompany = useCallback(async (fields) => {
    const d = await companyFetch('/company/register', { method: 'POST', body: JSON.stringify(fields) });
    localStorage.setItem('sf_company_token', d.data.token);
    setCompany(d.data.company);
    return d;
  }, []);

  const logoutCompany = useCallback(() => {
    localStorage.removeItem('sf_company_token');
    setCompany(null);
  }, []);

  const updateCompanyProfile = useCallback(async (fields) => {
    const d = await companyFetch('/company/profile', { method: 'PUT', body: JSON.stringify(fields) });
    setCompany(d.data.company);
    return d;
  }, []);

  return (
    <AuthContext.Provider value={{
      // Seller
      user, shipments, loginUser, registerUser, logoutUser,
      updateProfile, changePassword, addShipment, refreshShipments,
      // Company
      company, loginCompany, registerCompany, logoutCompany, updateCompanyProfile,
      // Shared
      loading,
      // Helper: is anyone logged in?
      isAuthenticated: !!(user || company),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
