"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Tiny icons ─────────────────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
);
const LinkIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path strokeLinecap="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <path strokeLinecap="round" d="M9 18l6-6-6-6"/>
  </svg>
);

const ROLE_COLORS = { owner: "#f59e0b", admin: "#a78bfa", member: "#34d399" };
const ROLE_ORDER  = { owner: 2, admin: 1, member: 0 };

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || "#a0a0b8";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "capitalize", background: `${c}18`, border: `1px solid ${c}40`, color: c }}>
      {role}
    </span>
  );
}

/* ─── Create workspace form ──────────────────────────────────────────────────── */
function CreateWorkspaceForm({ onCreate }) {
  const [name, setName]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create");
      setName("");
      onCreate(json);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} style={{ marginBottom: 24 }}>
      {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name…"
          maxLength={60}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13, outline: "none" }}
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: saving ? "rgba(124,58,237,0.4)" : "#7c3aed", color: "white", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <PlusIcon />
          {saving ? "…" : "Create"}
        </button>
      </div>
    </form>
  );
}

/* ─── Workspace detail panel ─────────────────────────────────────────────────── */
function WorkspaceDetail({ workspace, currentUserId, onBack }) {
  const [members, setMembers]   = useState([]);
  const [invites, setInvites]   = useState([]);
  const [loadM, setLoadM]       = useState(true);
  const [loadI, setLoadI]       = useState(true);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole]   = useState("member");
  const [inviting, setInviting] = useState(false);
  const [invCopied, setInvCopied] = useState({});
  const [error, setError]       = useState(null);

  const isOwner = workspace.role === "owner";
  const isAdmin = isOwner || workspace.role === "admin";

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspace.id}/members`);
    setMembers(await res.json());
    setLoadM(false);
  }, [workspace.id]);

  const loadInvites = useCallback(async () => {
    if (!isAdmin) { setLoadI(false); return; }
    const res = await fetch(`/api/workspaces/${workspace.id}/invite`);
    setInvites(await res.json());
    setLoadI(false);
  }, [workspace.id, isAdmin]);

  useEffect(() => { loadMembers(); loadInvites(); }, [loadMembers, loadInvites]);

  async function sendInvite(e) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const body = { role: invRole };
      if (invEmail.trim()) body.email = invEmail.trim();
      const res  = await fetch(`/api/workspaces/${workspace.id}/invite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to invite");
      setInvEmail("");
      setInvites((p) => [json, ...p]);
    } catch (e) { setError(e.message); }
    finally { setInviting(false); }
  }

  async function revokeInvite(inviteId) {
    await fetch(`/api/workspaces/${workspace.id}/invite?inviteId=${inviteId}`, { method: "DELETE" });
    setInvites((p) => p.filter((i) => i.id !== inviteId));
  }

  async function removeMember(memberId) {
    if (!window.confirm("Remove this member?")) return;
    await fetch(`/api/workspaces/${workspace.id}/members?memberId=${memberId}`, { method: "DELETE" });
    setMembers((p) => p.filter((m) => m.id !== memberId));
  }

  async function changeRole(memberId, role) {
    const res  = await fetch(`/api/workspaces/${workspace.id}/members`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, role }) });
    const json = await res.json();
    if (res.ok) setMembers((p) => p.map((m) => m.id === memberId ? { ...m, role: json.role } : m));
  }

  function copyInviteLink(token) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setInvCopied((p) => ({ ...p, [token]: true }));
    setTimeout(() => setInvCopied((p) => ({ ...p, [token]: false })), 2200);
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div>
      {/* Back + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>{workspace.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <RoleBadge role={workspace.role} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>{error}</p>}

      {/* Members */}
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Members</h3>
      {loadM ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Loading…</p>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {members.sort((a, b) => (ROLE_ORDER[b.role] || 0) - (ROLE_ORDER[a.role] || 0)).map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                {(m.email?.[0] || "?").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email || m.user_id}</p>
              </div>
              <RoleBadge role={m.role} />
              {isAdmin && m.role !== "owner" && m.user_id !== currentUserId && (
                <div style={{ display: "flex", gap: 4 }}>
                  {isOwner && m.role !== "admin" && (
                    <button onClick={() => changeRole(m.id, "admin")} title="Promote to admin" style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      ↑ Admin
                    </button>
                  )}
                  {m.role === "admin" && isOwner && (
                    <button onClick={() => changeRole(m.id, "member")} title="Demote to member" style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)", color: "#fbbf24", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      ↓ Member
                    </button>
                  )}
                  <button onClick={() => removeMember(m.id)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.07)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite section (admin+) */}
      {isAdmin && (
        <>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Invite people</h3>
          <form onSubmit={sendInvite} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
              type="email"
              placeholder="Email (optional)"
              style={{ flex: 1, padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, outline: "none" }}
            />
            <select
              value={invRole}
              onChange={(e) => setInvRole(e.target.value)}
              style={{ padding: "9px 10px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12, cursor: "pointer" }}
            >
              <option value="member">Member</option>
              {isOwner && <option value="admin">Admin</option>}
            </select>
            <button type="submit" disabled={inviting} style={{ padding: "9px 14px", borderRadius: 9, border: "none", background: "#7c3aed", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <LinkIcon /> {inviting ? "…" : "Invite"}
            </button>
          </form>

          {/* Pending invites */}
          {!loadI && invites.filter((i) => !i.accepted_at).length > 0 && (
            <>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Pending invites</h3>
              {invites.filter((i) => !i.accepted_at).map((inv) => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: inv.email ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.email || "Link-only invite"}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                      Expires {new Date(inv.expires_at).toLocaleDateString()} · {inv.role}
                    </p>
                  </div>
                  <button
                    onClick={() => copyInviteLink(inv.token)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.08)", color: invCopied[inv.token] ? "#4ade80" : "#a78bfa", fontWeight: 600, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <CopyIcon /> {invCopied[inv.token] ? "Copied!" : "Copy link"}
                  </button>
                  <button onClick={() => revokeInvite(inv.id)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.07)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Main TeamView ──────────────────────────────────────────────────────────── */
export default function TeamView({ user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((json) => setWorkspaces(Array.isArray(json) ? json : []))
      .finally(() => setLoading(false));
  }, []);

  function handleCreate(ws) {
    setWorkspaces((p) => [ws, ...p]);
    setSelected(ws);
  }

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px", fontFamily: font }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa" }}>
            <UsersIcon />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.3px" }}>Team</h1>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Create workspaces and collaborate with teammates on PDF analysis.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <WorkspaceDetail
              workspace={selected}
              currentUserId={user?.id}
              onBack={() => setSelected(null)}
            />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
            <CreateWorkspaceForm onCreate={handleCreate} />

            {workspaces.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.25)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <p style={{ fontSize: 14 }}>No workspaces yet — create one above.</p>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Your workspaces</h3>
                {workspaces.map((ws) => (
                  <motion.div
                    key={ws.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelected(ws)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 900, color: "white", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws.name}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, marginTop: 2 }}>
                        Joined {new Date(ws.joinedAt || ws.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <RoleBadge role={ws.role} />
                    <ChevronRight />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
