import { useState, useEffect } from "react";
import * as api from "../api";

export default function WorkersPage({ onToast }) {
  const [workers,    setWorkers]   = useState([]);
  const [categories, setCats]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState("");
  const [catFilter,  setCF]        = useState("");
  const [statusFilter, setSF]      = useState("all");
  const [busy,       setBusy]      = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [w, c] = await Promise.all([api.getAllWorkers(), api.getCategories()]);
      setWorkers(w);
      setCats(c);
    } catch { onToast("Failed to load workers", "error"); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id, name) => {
    setBusy(p => ({ ...p, [id]: "approve" }));
    try {
      await api.approveWorker(id);
      setWorkers(p => p.map(w => w.id === id ? { ...w, approved: true } : w));
      onToast(`${name} approved ✓`);
    } catch { onToast("Approval failed", "error"); }
    finally { setBusy(p => ({ ...p, [id]: null })); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete worker "${name}"?`)) return;
    setBusy(p => ({ ...p, [id]: "delete" }));
    try {
      await api.deleteWorker(id);
      setWorkers(p => p.filter(w => w.id !== id));
      onToast(`${name} deleted`);
    } catch (e) {
      onToast(e.response?.data?.error || "Delete failed", "error");
    } finally { setBusy(p => ({ ...p, [id]: null })); }
  };

  const getCat = id => cats.find(c => c.id === id);
  const cats   = categories;

  const filtered = workers.filter(w => {
    const q = search.toLowerCase();
    const mQ = !q || w.name.toLowerCase().includes(q) || w.email.toLowerCase().includes(q);
    const mC = !catFilter || w.categoryId === parseInt(catFilter);
    const mS = statusFilter === "all" ? true :
               statusFilter === "approved" ? w.approved :
               statusFilter === "pending"  ? !w.approved : true;
    return mQ && mC && mS;
  });

  const pendingCount = workers.filter(w => !w.approved).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5, fontFamily: "'Outfit',sans-serif" }}>
          Worker Management
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
          {workers.length} total workers · {pendingCount} pending approval
        </p>
      </div>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div style={{
          background: "var(--amber-bg)", border: "1px solid var(--amber-border)",
          borderRadius: 12, padding: "12px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10, fontSize: 13,
        }}>
          ⚠️ <strong>{pendingCount} worker{pendingCount > 1 ? "s" : ""}</strong> waiting for approval to go live on the platform
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search workers…" style={{ flex: 1, minWidth: 180 }} />
        <select value={catFilter} onChange={e => setCF(e.target.value)} style={{ width: "auto", minWidth: 150 }}>
          <option value="">All Categories</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {["all", "approved", "pending"].map(s => (
          <button key={s} onClick={() => setSF(s)} style={{
            padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
            border: statusFilter === s ? "none" : "1.5px solid var(--border)",
            background: statusFilter === s ? "var(--primary)" : "white",
            color: statusFilter === s ? "white" : "var(--muted)",
            fontFamily: "inherit",
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>No workers found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Location (Pincode)</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={w.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=2563eb&color=fff&size=40`}
                        style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{w.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{getCat(w.categoryId)?.name || "—"}</span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{w.phone || "—"}</td>
                  <td style={{ fontSize: 12 }}>
                    {w.pincode ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>📍 {w.pincode}</div>
                        {w.street && <div style={{ color: "var(--muted)" }}>{w.street}</div>}
                      </div>
                    ) : w.lat ? (
                      <span style={{ color: "var(--muted)" }}>GPS only</span>
                    ) : "—"}
                  </td>
                  <td>
                    {w.rating > 0 ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                        ⭐ {w.rating} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({w.jobsCompleted})</span>
                      </span>
                    ) : <span style={{ color: "var(--muted)" }}>New</span>}
                  </td>
                  <td>
                    {w.approved ? (
                      <span className="badge badge-green">✓ Approved</span>
                    ) : (
                      <span className="badge badge-amber">⏳ Pending</span>
                    )}
                    {w.availability && w.approved && (
                      <span className="badge badge-green" style={{ marginLeft: 4 }}>Online</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {!w.approved && (
                        <button
                          className="btn btn-green btn-sm"
                          disabled={busy[w.id] === "approve"}
                          onClick={() => handleApprove(w.id, w.name)}
                        >
                          {busy[w.id] === "approve" ? "…" : "✓ Approve"}
                        </button>
                      )}
                      <button
                        className="btn btn-red btn-sm"
                        disabled={busy[w.id] === "delete"}
                        onClick={() => handleDelete(w.id, w.name)}
                      >
                        {busy[w.id] === "delete" ? "…" : "🗑"}
                      </button>
                    </div>
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
