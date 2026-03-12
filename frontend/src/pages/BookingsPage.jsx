import { useState, useEffect } from "react";
import * as api from "../api";

const STATUS_COLORS = {
  pending:     "badge-amber",
  accepted:    "badge-blue",
  in_progress: "badge-purple",
  completed:   "badge-green",
  confirmed:   "badge-green",
  rejected:    "badge-red",
};

export default function BookingsPage({ onToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [deleting, setDel]      = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setBookings([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { onToast("Failed to load bookings", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking? This cannot be undone.")) return;
    setDel(id);
    try {
      await api.deleteBooking(id);
      setBookings(p => p.filter(b => b.id !== id));
      onToast("Booking deleted");
    } catch { onToast("Delete failed", "error"); }
    finally { setDel(null); }
  };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const mQ = !q || b.userName?.toLowerCase().includes(q) || b.workerName?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q);
    const mS = !statusF || b.status === statusF;
    return mQ && mS;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    active: bookings.filter(b => ["accepted", "in_progress"].includes(b.status)).length,
    done: bookings.filter(b => ["completed", "confirmed"].includes(b.status)).length,
    revenue: bookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + (b.cost || 0), 0),
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5, fontFamily: "'Outfit',sans-serif" }}>
          Booking Management
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
          Monitor all service requests across the platform
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total",    value: stats.total,   color: "var(--primary)", bg: "var(--primary-bg)" },
          { label: "Pending",  value: stats.pending, color: "var(--amber)",   bg: "var(--amber-bg)"   },
          { label: "Active",   value: stats.active,  color: "#7c3aed",        bg: "#f5f3ff"           },
          { label: "Completed",value: stats.done,    color: "var(--green)",   bg: "var(--green-bg)"   },
          { label: "Revenue",  value: `₹${stats.revenue.toLocaleString()}`, color: "var(--blue)", bg: "var(--blue-bg)" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Outfit',sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search customer, worker, category…" style={{ flex: 1, minWidth: 200 }} />
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">All Statuses</option>
          {["pending", "accepted", "in_progress", "completed", "confirmed", "rejected"].map(s => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>No bookings found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Worker</th>
                <th>Category</th>
                <th>Date</th>
                <th>Cost</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <>
                  <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                    <td style={{ fontWeight: 600 }}>{b.userName}</td>
                    <td style={{ color: "var(--muted)" }}>{b.workerName}</td>
                    <td>
                      {b.category && <span className="badge badge-blue">{b.category}</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>
                      {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{(b.cost || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${b.paymentStatus === "paid" ? "badge-green" : "badge-gray"}`}>
                        {b.paymentStatus || "unpaid"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[b.status] || "badge-gray"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-red btn-sm"
                        disabled={deleting === b.id}
                        onClick={() => handleDelete(b.id)}
                      >
                        {deleting === b.id ? "…" : "🗑"}
                      </button>
                    </td>
                  </tr>
                  {expanded === b.id && (
                    <tr key={`${b.id}-detail`}>
                      <td colSpan={8} style={{ background: "#fafafa", padding: "16px 24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 24px", fontSize: 12 }}>
                          {[
                            ["Booking ID", b.id],
                            ["Duration", `${b.duration || 1} hr`],
                            ["Hourly Rate", `₹${b.hourlyRate || 0}`],
                            ["Service Cost", `₹${b.serviceCost || 0}`],
                            ["Platform Fee", `₹${b.platformFee || 0}`],
                            ["Worker Payout", `₹${b.workerPayout || 0}`],
                            ["Commission Status", b.commissionStatus || "—"],
                            ["Transaction ID", b.transactionId || "—"],
                            ["Notes", b.notes || "—"],
                            ["Created", new Date(b.createdAt).toLocaleString("en-IN")],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <div style={{ fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 2 }}>{label}</div>
                              <div style={{ color: "var(--text)" }}>{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
