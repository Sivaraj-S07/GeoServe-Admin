import { createContext, useContext, useState, useEffect } from "react";
import * as api from "../api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin]   = useState(null);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("admin_user");
    if (saved) {
      try { setAdmin(JSON.parse(saved)); } catch {}
    }
    setLoad(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.adminLogin(email, password);
    localStorage.setItem("admin_token", data.token);
    localStorage.setItem("admin_user", JSON.stringify(data.user));
    setAdmin(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setAdmin(null);
  };

  if (loading) return null;
  return (
    <AuthCtx.Provider value={{ admin, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAdmin = () => useContext(AuthCtx);
