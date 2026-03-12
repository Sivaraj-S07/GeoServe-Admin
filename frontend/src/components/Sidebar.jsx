import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "../context/AuthContext";

const NAV = [
  { path: "/",          label: "Dashboard",   icon: "📊" },
  { path: "/users",     label: "Users",       icon: "👥" },
  { path: "/workers",   label: "Workers",     icon: "🔧" },
  { path: "/bookings",  label: "Bookings",    icon: "📅" },
  { path: "/analytics", label: "Analytics",   icon: "📈" },
];

export default function Sidebar() {
  const { admin, logout } = useAdmin();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🗺️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif", letterSpacing: -.3 }}>GeoServe</div>
            <div style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700, letterSpacing: .5, textTransform: "uppercase" }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      {admin && (
        <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: 14,
            }}>
              {admin.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{admin.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Administrator</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ padding: "12px 12px", flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase", padding: "0 6px", marginBottom: 6 }}>
          Navigation
        </div>
        {NAV.map(item => (
          <button
            key={item.path}
            className={`nav-item${pathname === item.path ? " active" : ""}`}
            onClick={() => nav(item.path)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 12px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          background: "var(--primary-bg)", border: "1px solid var(--primary-border)",
          borderRadius: 10, padding: "10px 12px", marginBottom: 10,
          fontSize: 11, color: "var(--primary)", fontWeight: 600,
        }}>
          🔗 Connected to main app database
        </div>
        <button className="nav-item" onClick={logout} style={{ color: "var(--red)" }}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
