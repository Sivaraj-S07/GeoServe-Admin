import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AuthContext";

export default function LoginPage({ onToast }) {
  const { login } = useAdmin();
  const nav = useNavigate();
  const [email, setEmail]   = useState("admin@gmail.com");
  const [pass,  setPass]    = useState("");
  const [err,   setErr]     = useState("");
  const [busy,  setBusy]    = useState(false);
  const [show,  setShow]    = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !pass) { setErr("Email and password are required"); return; }
    setBusy(true); setErr("");
    try {
      const user = await login(email, pass);
      if (user.role !== "admin") {
        setErr("This account does not have admin privileges.");
        setBusy(false);
        return;
      }
      onToast(`Welcome back, ${user.name}!`);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.error || "Invalid credentials");
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 100%)",
      padding: 24,
    }}>
      {/* BG decorations */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.03)", pointerEvents: "none" }} />

      <div style={{
        background: "white", borderRadius: 24, padding: "40px 40px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 80px rgba(0,0,0,.3)",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", fontSize: 28,
            boxShadow: "0 8px 32px rgba(79,70,229,.4)",
          }}>🗺️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Outfit',sans-serif", letterSpacing: -.5, marginBottom: 4 }}>
            GeoServe Admin
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Sign in to manage the platform</p>
        </div>

        {/* Admin-only banner */}
        <div style={{
          background: "var(--primary-bg)", border: "1px solid var(--primary-border)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 12, color: "var(--primary)", fontWeight: 600,
        }}>
          🔐 This portal is for administrators only
        </div>

        {err && (
          <div style={{
            background: "var(--red-bg)", border: "1px solid var(--red-border)",
            borderRadius: 10, padding: "11px 14px", marginBottom: 16,
            color: "var(--red)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
          }}>
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label>Admin Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
            />
          </div>
          <div>
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Enter password"
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShow(s => !s)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 16,
              }}>
                {show ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={busy} style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "white", border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "'Outfit',sans-serif", letterSpacing: -.2,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: busy ? 0.7 : 1,
            boxShadow: "0 4px 20px rgba(79,70,229,.4)",
            marginTop: 4,
          }}>
            {busy ? <><div className="spinner" /> Signing in…</> : "🔑 Sign In to Admin Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
