import { useState, useEffect } from "react";
import * as api from "../api";

function StatCard({ icon, label, value, color, subtitle }) {
  const colors = {
    primary: { bg: "var(--primary-bg)", border: "var(--primary-border)", text: "var(--primary)" },
    green:   { bg: "var(--green-bg)",   border: "var(--green-border)",   text: "var(--green)"   },
    amber:   { bg: "var(--amber-bg)",   border: "var(--amber-border)",   text: "var(--amber)"   },
    blue:    { bg: "var(--blue-bg)",    border: "var(--blue-border)",    text: "var(--blue)"    },
    purple:  { bg: "#f5f3ff",           border: "#ddd6fe",               text: "#7c3aed"         },
  };
  const c = colors[color] || colors.primary;
  return (
    <div className="stat-card" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: c.bg, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: "var(--text)", lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

export default function Dashboard({ onToast }) {
  const [stats,   setStats]   = useState(null);
  const [workers, setWorkers] = useState([]);
  const [bookings,setBookings]= useState([]);
  const [wallet,  setWallet]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, w, b, wl] = await Promise.all([
        api.getUserStats(),
        api.getAllWorkers(),
        api.getBookings(),
        api.getCommissionWallet().catch(() => null),
      ]);
      setStats(s);
      setWorkers(w);
      setBookings(b);
      setWallet(wl);
    } catch (e) {
      onToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const pending       = workers.filter(w => !w.approved).length;
  const activeWorkers = workers.filter(w => w.approved && w.availability).length;
  const pendingBks    = bookings.filter(b => b.status === "pending").length;
  const completedBks  = bookings.filter(b => ["completed", "confirmed"].includes(b.status)).length;

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const STATUS_COLORS = {
    pending:     "badge-amber",
    accepted:    "badge-blue",
    in_progress: "badge-purple",
    completed:   "badge-green",
    confirmed:   "badge-green",
    rejected:    "badge-red",
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div className="spinner" style={{ border: "2px solid var(--primary)", borderTopColor: "transparent", margin: "0 auto" }} />
      <p style={{ color: "var(--muted)", marginTop: 12 }}>Loading dashboard…</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.5, fontFamily: "'Outfit',sans-serif" }}>
          Dashboard Overview
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
          Welcome to GeoServe Admin Panel — platform summary at a glance
        </p>
      </div>

      {/* Pending approvals banner */}
      {pending > 0 && (
        <div style={{
          background: "var(--amber-bg)", border: "1px solid var(--amber-border)",
          borderRadius: 12, padding: "14px 18px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: "var(--amber)", fontSize: 14 }}>
              {pending} worker{pending > 1 ? "s" : ""} awaiting approval
            </div>
            <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
              Go to Workers → Pending Approval to review and approve new worker registrations.
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="👥" label="Total Users" value={stats?.users || 0} color="primary" subtitle="Registered customers" />
        <StatCard icon="🔧" label="Total Workers" value={workers.length} color="blue" subtitle={`${activeWorkers} active now`} />
        <StatCard icon="📅" label="Total Bookings" value={bookings.length} color="purple" subtitle={`${pendingBks} pending`} />
        <StatCard icon="✅" label="Completed" value={completedBks} color="green" subtitle="Successfully done" />
        {wallet && (
          <StatCard icon="💰" label="Commission Wallet" value={`₹${wallet.balance?.toLocaleString() || 0}`} color="amber" subtitle="Platform earnings" />
        )}
      </div>

      {/* Recent bookings */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>Recent Bookings</h2>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Last {recentBookings.length} bookings</span>
        </div>
        {recentBookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--muted)" }}>No bookings yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Worker</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.userName}</td>
                  <td>{b.workerName}</td>
                  <td>{b.category || "—"}</td>
                  <td style={{ color: "var(--muted)" }}>
                    {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{b.cost?.toLocaleString() || 0}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[b.status] || "badge-gray"}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
