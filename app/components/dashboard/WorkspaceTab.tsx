"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, UserPlus, CheckCircle2, Trash2, X,
  Link2, Crown, Shield, AlertCircle, Plus, Clock, ChevronDown, ChevronUp,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface Member {
  id: string;
  user_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

interface Invite {
  id: string;
  email: string | null;
  role: "member" | "admin";
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  url?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actor_id: string | null;
  actor_email: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

interface WorkspaceTabProps {
  userId: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://intellixy.com";

function RolePill({ role }: { role: string }) {
  const icon =
    role === "owner" ? <Crown size={10} /> :
    role === "admin" ? <Shield size={10} /> : null;
  return (
    <span className={`ix-ws-role-pill ${role}`}>
      {icon}{role}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function auditLabel(entry: AuditEntry): string {
  const actor = entry.actor_email ? entry.actor_email.split("@")[0] : "Someone";
  switch (entry.action) {
    case "workspace_created": return `${actor} created the workspace`;
    case "workspace_rename":  return `${actor} renamed the workspace to "${entry.meta.name}"`;
    case "invite_sent":       return entry.meta.email ? `${actor} invited ${entry.meta.email}` : `${actor} created an invite link`;
    case "invite_revoked":    return `${actor} revoked an invite`;
    case "invite_accepted":   return `${actor} joined the workspace`;
    case "member_join":       return `${actor} joined the workspace`;
    case "role_change":       return `${actor} changed a member's role to ${entry.meta.role}`;
    case "member_remove":     return `${actor} removed a member`;
    default:                  return `${actor} performed: ${entry.action}`;
  }
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.ceil(diff / 86400000);
  if (d <= 0) return "Expired";
  if (d === 1) return "Expires tomorrow";
  return `Expires in ${d}d`;
}

export default function WorkspaceTab({ userId }: WorkspaceTabProps) {
  const [workspaces,  setWorkspaces]  = useState<Workspace[] | null>(null);
  const [members,     setMembers]     = useState<Member[]>([]);
  const [invites,     setInvites]     = useState<Invite[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [wsName,      setWsName]      = useState("");
  const [createErr,   setCreateErr]   = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState<"member" | "admin">("member");
  const [sending,     setSending]     = useState(false);
  const [sendErr,     setSendErr]     = useState<string | null>(null);
  const [sendOk,      setSendOk]      = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [removing,    setRemoving]    = useState<string | null>(null);
  const [revoking,    setRevoking]    = useState<string | null>(null);
  const [auditLog,    setAuditLog]    = useState<AuditEntry[]>([]);
  const [auditLoad,   setAuditLoad]   = useState(false);
  const [showAudit,   setShowAudit]   = useState(false);

  const ws        = workspaces?.[0] ?? null;
  const myRole    = ws?.role ?? "member";
  const canManage = myRole === "owner" || myRole === "admin";

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/workspaces", { credentials: "include" });
      const data = await res.json();
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch {
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetails = useCallback(async (wsId: string, isManager: boolean) => {
    const [mRes, iRes] = await Promise.all([
      fetch(`/api/workspaces/${wsId}/members`, { credentials: "include" }),
      isManager
        ? fetch(`/api/workspaces/${wsId}/invite`, { credentials: "include" })
        : Promise.resolve(null),
    ]);
    const mData = await mRes.json();
    setMembers(Array.isArray(mData) ? mData : []);
    if (iRes) {
      const iData = await iRes.json();
      setInvites(Array.isArray(iData) ? iData.filter((i: Invite) => !i.accepted_at) : []);
    }
  }, []);

  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);

  useEffect(() => {
    if (!ws) return;
    loadDetails(ws.id, canManage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.id, canManage]);

  async function handleCreate() {
    if (!wsName.trim()) { setCreateErr("Please enter a workspace name."); return; }
    setCreating(true); setCreateErr(null);
    try {
      const res  = await fetch("/api/workspaces", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateErr(data.error || "Failed to create workspace"); return; }
      setWorkspaces([data]);
    } catch {
      setCreateErr("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSendInvite() {
    if (!ws) return;
    setSending(true); setSendErr(null); setSendOk(null);
    try {
      const res  = await fetch(`/api/workspaces/${ws.id}/invite`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() || null, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setSendErr(data.error || "Failed to create invite"); return; }
      setInvites(prev => [data, ...prev]);
      const url = data.url || `${APP_URL}/invite/${data.token}`;
      navigator.clipboard.writeText(url).catch(() => {});
      setSendOk(inviteEmail.trim() ? "Invite sent · link copied!" : "Invite link copied!");
      setInviteEmail("");
      setTimeout(() => setSendOk(null), 3500);
    } catch {
      setSendErr("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleCopyLink() {
    if (!ws) return;
    try {
      const res  = await fetch(`/api/workspaces/${ws.id}/invite`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setInvites(prev => [data, ...prev]);
      const url = data.url || `${APP_URL}/invite/${data.token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  async function handleRemoveMember(memberId: string) {
    if (!ws || !confirm("Remove this member from the workspace?")) return;
    setRemoving(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${ws.id}/members?memberId=${memberId}`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {}
    finally { setRemoving(null); }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!ws) return;
    setRevoking(inviteId);
    try {
      const res = await fetch(
        `/api/workspaces/${ws.id}/invite?inviteId=${inviteId}`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) setInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch {}
    finally { setRevoking(null); }
  }

  async function handleToggleAudit() {
    if (!ws) return;
    setShowAudit(prev => !prev);
    if (!showAudit && auditLog.length === 0) {
      setAuditLoad(true);
      try {
        const res = await fetch(`/api/workspaces/${ws.id}/audit`, { credentials: "include" });
        const data = await res.json();
        setAuditLog(Array.isArray(data) ? data : []);
      } catch {}
      finally { setAuditLoad(false); }
    }
  }

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <div style={{
          width: 24, height: 24,
          border: "3px solid var(--border)", borderTopColor: "var(--purple)",
          borderRadius: "50%", animation: "ix-spin .7s linear infinite",
        }} />
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Section header */}
      <div className="ix-doc-section-head">
        <div className="ix-section-title"><Users size={16} /> Team Workspace</div>
      </div>

      {/* Early-access notice */}
      <div className="ix-ws-notice">
        <AlertCircle size={15} style={{ color: "var(--orange)", flexShrink: 0, marginTop: 1 }} />
        <p>
          <strong>Early access</strong> — Workspace management and activity audit log are live.
          Shared document permissions are coming soon as part of the Team plan.
        </p>
      </div>

      {/* ── No workspace yet ── */}
      {!ws ? (
        <div className="ix-card">
          <div className="ix-ws-empty">
            <div className="ix-ws-empty-icon">
              <Users size={32} style={{ color: "var(--purple)" }} />
            </div>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                Create your team workspace
              </p>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 320 }}>
                Invite colleagues, manage access, and collaborate on documents together.
              </p>
            </div>
            <div className="ix-ws-create-form">
              <div className="ix-ws-field">
                <label className="ix-ws-label">Workspace name</label>
                <input
                  className="ix-ws-name-input"
                  value={wsName}
                  onChange={e => setWsName(e.target.value)}
                  placeholder="e.g. Legal Team, Acme Corp"
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                />
              </div>
              {createErr && (
                <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>{createErr}</p>
              )}
              <button
                className="ix-ws-invite-btn"
                onClick={handleCreate}
                disabled={creating}
                style={{ alignSelf: "flex-start" }}
              >
                <Plus size={13} />
                {creating ? "Creating…" : "Create workspace"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Workspace header ── */}
          <div className="ix-ws-header">
            <div className="ix-ws-header-icon"><Users size={22} /></div>
            <div style={{ flex: 1 }}>
              <div className="ix-ws-name">{ws.name}</div>
              <div className="ix-ws-meta">
                {members.length} member{members.length !== 1 ? "s" : ""} · Created {timeAgo(ws.created_at)}
              </div>
            </div>
            <RolePill role={myRole} />
          </div>

          {/* ── Members list ── */}
          <div className="ix-ws-members">
            <div className="ix-ws-members-head">
              <span className="ix-section-title" style={{ fontSize: 13 }}>
                <Users size={14} /> Members
              </span>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                {members.length} total
              </span>
            </div>

            {members.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                No members yet. Invite your first colleague below.
              </div>
            ) : (
              members.map(m => {
                const initial  = m.email?.[0]?.toUpperCase() ?? "?";
                const isSelf   = m.user_id === userId;
                const canRemove =
                  (canManage && m.role !== "owner") ||
                  (isSelf   && m.role !== "owner");

                return (
                  <div key={m.id} className="ix-ws-member-row">
                    <div className="ix-ws-member-av">{initial}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ix-ws-member-email">
                        {m.email}
                        {isSelf && (
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 6 }}>
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="ix-ws-member-joined">Joined {timeAgo(m.joined_at)}</div>
                    </div>
                    <RolePill role={m.role} />
                    {canRemove && (
                      <button
                        className="ix-ws-remove-btn"
                        onClick={() => handleRemoveMember(m.id)}
                        disabled={removing === m.id}
                        title={isSelf ? "Leave workspace" : "Remove member"}
                      >
                        {removing === m.id ? "…" : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Invite section (owners & admins only) ── */}
          {canManage && (
            <div className="ix-ws-invite-section">
              <div className="ix-section-title" style={{ fontSize: 13, marginBottom: 4 }}>
                <UserPlus size={14} /> Invite member
              </div>

              <div className="ix-ws-invite-row">
                <input
                  className="ix-ws-email-input"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com (optional)"
                  onKeyDown={e => e.key === "Enter" && handleSendInvite()}
                />
                <select
                  className="ix-ws-role-select"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as "member" | "admin")}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  className="ix-ws-invite-btn"
                  onClick={handleSendInvite}
                  disabled={sending}
                >
                  <UserPlus size={13} />
                  {sending ? "Sending…" : "Send invite"}
                </button>
                <button
                  className={`ix-ws-copy-btn${copied ? " copied" : ""}`}
                  onClick={handleCopyLink}
                >
                  {copied
                    ? <><CheckCircle2 size={13} /> Copied!</>
                    : <><Link2 size={13} /> Copy link</>
                  }
                </button>
              </div>

              {sendErr && (
                <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>{sendErr}</p>
              )}
              {sendOk && (
                <p style={{ fontSize: 12, color: "var(--green)", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 size={12} />{sendOk}
                </p>
              )}

              {/* Pending invites */}
              {invites.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <div className="ix-ws-pending-head">
                    Pending invites ({invites.length})
                  </div>
                  {invites.map(inv => (
                    <div key={inv.id} className="ix-ws-pending-item">
                      <Link2 size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                      <span className="ix-ws-pending-email">
                        {inv.email || "Anyone with the link"}
                      </span>
                      <RolePill role={inv.role} />
                      <span className="ix-ws-pending-exp">{daysUntil(inv.expires_at)}</span>
                      <button
                        className="ix-ws-revoke-btn"
                        onClick={() => handleRevokeInvite(inv.id)}
                        disabled={revoking === inv.id}
                        title="Revoke invite"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* ── Audit log ── */}
          <div className="ix-ws-audit">
            <button
              className="ix-ws-audit-toggle"
              onClick={handleToggleAudit}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: "var(--text-secondary)", fontSize: 13 }}
            >
              <Clock size={13} />
              Activity log
              {showAudit ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAudit && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 0 }}>
                {auditLoad && (
                  <div style={{ padding: "16px 0", color: "var(--text-tertiary)", fontSize: 12 }}>Loading…</div>
                )}
                {!auditLoad && auditLog.length === 0 && (
                  <div style={{ padding: "16px 0", color: "var(--text-tertiary)", fontSize: 12 }}>No activity yet.</div>
                )}
                {!auditLoad && auditLog.map((entry, i) => (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0",
                      borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginTop: 1,
                    }}>
                      {(entry.actor_email?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.4 }}>
                        {auditLabel(entry)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                        {timeAgo(entry.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
