import { useState, useEffect } from "react";
import * as api from "../api";

function ProgressBar({ value, max, color = "var(--primary)" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: "var(--bg-subtle)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width .5s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

export default function AnalyticsPage({ onToast }) {
  const [workers,  setWorkers]  = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cats,     setCats]     = useState([]);
  const [wallet,   setWallet]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [w, b, c, wl] = await Promise.all([
        api.getAllWorkers(), api.getBookings(), api.getCategories(),
        api.getCommissionWallet().catch(() => null),
      ]);
      setWorkers(w);
      setBookings(b);
      setCats(c);
      setWallet(wl);
    } catch { onToast("Failed to load analytics", "error"); }
    finally { setLoading(false); }
  };

  // Category breakdown
  const catStats = cats.map(c => ({
    name: c.name,
    workers: workers.filter(w => w.categoryId === c.id && w.approved).length,
    bookings: bookings.filter(b => {
      const w = workers.find(x => x.id === b.workerId);
      return w?.categoryId === c.id;
    }).length,
  })).filter(x => x.workers > 0 || x.bookings > 0);

  // Pincode breakdown
  const pincodeMap = new Map();
  [...workers, ...bookings].forEach(item => {
    const pc = item.pincode;
    if (pc) {
      if (!pincodeMap.has(pc)) pincodeMap.set(pc, { workers: 0, bookings: 0 });
      if (item.categoryId !== undefined) pincodeMap.get(pc).workers++;
      else pincodeMap.get(pc).bookings++;
    }
  });
  const pincodeStats = Array.from(pincodeMap.entries())
    .map(([pincode, counts]) => ({ pincode, ...counts }))
    .sort((a, b) => (b.workers + b.bookings) - (a.workers + a.bookings))
    .slice(0, 8);

  // Status breakdown
  const statusCounts = {};
  bookings.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });

  const totalRevenue = bookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + (b.cost || 0), 0);
  const totalCommission = bookings.filter(b => b.commissionStatus === "credited").reduce((s, b) => s + (b.adminCommission || 0), 0);
  const maxCatBookings = Math.max(...catStats.map(c => c.bookings), 1);

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}>Loading analytics…</div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5, fontFamily: "'Outfit',sans-serif" }}>Platform Analytics</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>Overview of platform activity and growth metrics</p>
      </div>

      {/* Revenue cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: "💰", color: "var(--green)", bg: "var(--green-bg)" },
          { label: "Commission Earned", value: `₹${totalCommission.toLocaleString()}`, icon: "📊", color: "var(--primary)", bg: "var(--primary-bg)" },
          { label: "Wallet Balance", value: `₹${wallet?.balance?.toLocaleString() || 0}`, icon: "👜", color: "var(--amber)", bg: "var(--amber-bg)" },
          { label: "Avg Booking Value", value: bookings.length > 0 ? `₹${Math.round(totalRevenue / bookings.length).toLocaleString()}` : "₹0", icon: "📈", color: "var(--blue)", bg: "var(--blue-bg)" },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color, fontFamily: "'Outfit',sans-serif" }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Category Performance */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, fontFamily: "'Outfit',sans-serif" }}>📂 Category Performance</h2>
          {catStats.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No category data yet</p>
          ) : catStats.map(c => (
            <div key={c.name} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>
                <span>{c.name}</span>
                <span style={{ color: "var(--muted)" }}>{c.bookings} bookings · {c.workers} workers</span>
              </div>
              <ProgressBar value={c.bookings} max={maxCatBookings} color="var(--primary)" />
            </div>
          ))}
        </div>

        {/* Booking Status Breakdown */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, fontFamily: "'Outfit',sans-serif" }}>📅 Booking Status Breakdown</h2>
          {Object.entries(statusCounts).length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No bookings yet</p>
          ) : Object.entries(statusCounts).map(([status, count]) => {
            const colors = { pending: "#d97706", accepted: "#2563eb", in_progress: "#7c3aed", completed: "#059669", confirmed: "#059669", rejected: "#dc2626" };
            return (
              <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "8px 12px", background: "var(--bg-subtle)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors[status] || "var(--muted)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{status.replace("_", " ")}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: colors[status] || "var(--text)", fontFamily: "'Outfit',sans-serif" }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pincode breakdown */}
      {pincodeStats.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, fontFamily: "'Outfit',sans-serif" }}>📍 Activity by Pincode</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {pincodeStats.map(p => (
              <div key={p.pincode} style={{
                background: "var(--bg-subtle)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "14px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: "var(--primary)" }}>
                  {p.pincode}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  {p.workers} worker{p.workers !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {p.bookings} booking{p.bookings !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
