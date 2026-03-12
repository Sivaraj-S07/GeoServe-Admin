import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAdmin } from "./context/AuthContext";
import LoginPage    from "./pages/LoginPage";
import Dashboard    from "./pages/Dashboard";
import UsersPage    from "./pages/UsersPage";
import WorkersPage  from "./pages/WorkersPage";
import BookingsPage from "./pages/BookingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Sidebar      from "./components/Sidebar";
import Toast        from "./components/Toast";
import { useState } from "react";

function Guard({ children }) {
  const { admin } = useAdmin();
  return admin ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main anim-fade">{children}</main>
    </div>
  );
}

function AppInner() {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <Routes>
        <Route path="/login" element={<LoginPage onToast={showToast} />} />
        <Route path="/" element={<Guard><Layout><Dashboard onToast={showToast} /></Layout></Guard>} />
        <Route path="/users" element={<Guard><Layout><UsersPage onToast={showToast} /></Layout></Guard>} />
        <Route path="/workers" element={<Guard><Layout><WorkersPage onToast={showToast} /></Layout></Guard>} />
        <Route path="/bookings" element={<Guard><Layout><BookingsPage onToast={showToast} /></Layout></Guard>} />
        <Route path="/analytics" element={<Guard><Layout><AnalyticsPage onToast={showToast} /></Layout></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
