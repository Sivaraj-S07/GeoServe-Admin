import { useState, useEffect } from "react";
import * as api from "../api";

export default function UsersPage({ onToast }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [roleFilter, setRF]   = useState("");
  const [deleting, setDel]    = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch { onToast("Failed to load users", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDel(id);
    try {
      await api.deleteUser(id);
      setUsers(p => p.filter(u => u.id !== id));
      onToast(`User "${name}" deleted`);
    } catch (e) {
      onToast(e.response?.data?.error || "Delete failed", "error");
    } finally { setDel(null); }
  };

  const ROLE_COLORS = { admin: "badge-purple", worker: "badge-blue", user: "badge-green" };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const mQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const mR = !roleFilter || u.role === roleFilter;
    return mQ && mR;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5, fontFamily: "'Outfit',sans-serif" }}>
          User Management
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
          {users.length} registered accounts on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name or email…"
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={roleFilter} onChange={e => setRF(e.target.value)} style={{ width: "auto", minWidth: 140 }}>
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="worker">Workers</option>
          <option value="admin">Admins</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
            No users found matching your search
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Location (Pincode)</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: u.role === "admin" ? "linear-gradient(135deg, #7c3aed,#4f46e5)" : u.role === "worker" ? "linear-gradient(135deg, #2563eb,#3b82f6)" : "linear-gradient(135deg, #059669,#10b981)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 800, fontSize: 14, flexShrink: 0,
                      }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{u.email}</td>
                  <td>
                    <span className={`badge ${ROLE_COLORS[u.role] || "badge-gray"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>
                    {u.pincode ? (
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text)" }}>📍 {u.pincode}</div>
                        {u.street && <div>{u.street}</div>}
                      </div>
                    ) : (
                      <span style={{ opacity: 0.5 }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td>
                    {u.role !== "admin" && (
                      <button
                        className="btn btn-red btn-sm"
                        disabled={deleting === u.id}
                        onClick={() => handleDelete(u.id, u.name)}
                      >
                        {deleting === u.id ? "…" : "🗑 Delete"}
                      </button>
                    )}
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
