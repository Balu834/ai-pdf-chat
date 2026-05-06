"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#080b14",
  card:     "rgba(255,255,255,0.04)",
  cardHv:   "rgba(255,255,255,0.065)",
  border:   "rgba(255,255,255,0.08)",
  accent:   "#7c3aed",
  accentL:  "#a78bfa",
  cyan:     "#06b6d4",
  gold:     "#f59e0b",
  green:    "#10b981",
  t1:       "#f1f5f9",
  t2:       "#94a3b8",
  t3:       "#475569",
};

const CAT_COLORS = {
  Productivity: { bg: "rgba(124,58,237,0.15)",  text: "#a78bfa", border: "rgba(124,58,237,0.3)"  },
  Finance:      { bg: "rgba(16,185,129,0.15)",   text: "#34d399", border: "rgba(16,185,129,0.3)"  },
  Legal:        { bg: "rgba(59,130,246,0.15)",   text: "#60a5fa", border: "rgba(59,130,246,0.3)"  },
  Education:    { bg: "rgba(245,158,11,0.15)",   text: "#fbbf24", border: "rgba(245,158,11,0.3)"  },
  Other:        { bg: "rgba(100,116,139,0.15)",  text: "#94a3b8", border: "rgba(100,116,139,0.3)" },
};
const CAT_ICON  = { Productivity: "⚙️", Finance: "💰", Legal: "⚖️", Education: "📚", Other: "🔮" };
const CATEGORIES = ["All", "Productivity", "Finance", "Legal", "Education", "Other"];
const SORT_OPTS  = [
  { v: "ranking",  l: "Top Ranked" },
  { v: "trending", l: "Trending"   },
  { v: "rating",   l: "Top Rated"  },
  { v: "new",      l: "Newest"     },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n)       { if ((n ?? 0) >= 1000) return `${((n) / 1000).toFixed(1)}k`; return String(n ?? 0); }
function stars(r)     { return `★ ${parseFloat(r ?? 0).toFixed(1)}`; }
function priceFmt(p)  { return (!p || p === 0) ? "Free" : `₹${(p / 100).toFixed(0)}`; }

// ─── Sub-components ────────────────────────────────────────────────────────────

function CatBadge({ cat }) {
  const cl = CAT_COLORS[cat] ?? CAT_COLORS.Other;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: cl.bg, color: cl.text, border: `1px solid ${cl.border}`, whiteSpace: "nowrap" }}>
      {CAT_ICON[cat] ?? "•"} {cat}
    </span>
  );
}

function TypeBadge({ type }) {
  const ag = type === "agent";
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: ag ? "rgba(124,58,237,0.15)" : "rgba(6,182,212,0.15)", color: ag ? C.accentL : C.cyan, border: `1px solid ${ag ? "rgba(124,58,237,0.25)" : "rgba(6,182,212,0.25)"}` }}>
      {ag ? "Agent" : "Template"}
    </span>
  );
}

function InstalledBadge() {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 6px", borderRadius: 99 }}>
      ✓ Installed
    </span>
  );
}

function HeartBtn({ item, onToggle }) {
  const [faved, setFaved] = useState(!!item?.favorited);
  const [busy,  setBusy]  = useState(false);
  async function toggle(e) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const prev = faved;
    setFaved(!prev);
    try {
      const r = await fetch(`/api/appstore/${item.type}/${item.id}/favorite`, { method: "POST" });
      const j = await r.json();
      setFaved(j.favorited);
      if (onToggle) onToggle(item, j.favorited);
    } catch { setFaved(prev); }
    setBusy(false);
  }
  return (
    <button onClick={toggle} title={faved ? "Remove favorite" : "Save to favorites"}
      style={{ background: "none", border: "none", cursor: busy ? "default" : "pointer", padding: "3px 4px", fontSize: 16, lineHeight: 1, color: faved ? "#f43f5e" : C.t3, transition: "all 0.15s", transform: faved ? "scale(1.2)" : "scale(1)" }}>
      {faved ? "♥" : "♡"}
    </button>
  );
}

// ─── Compact card (carousel) ──────────────────────────────────────────────────
function CompactCard({ item, onClick, onFavToggle }) {
  const [hov, setHov] = useState(false);
  const cc = CAT_COLORS[item.category] ?? CAT_COLORS.Other;
  return (
    <div onClick={() => onClick(item)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 200, flexShrink: 0, background: hov ? C.cardHv : C.card, border: `1px solid ${hov ? "rgba(124,58,237,0.3)" : C.border}`, borderRadius: 14, padding: "14px 14px 12px", cursor: "pointer", transition: "all 0.18s", position: "relative" }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: cc.bg, border: `1px solid ${cc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 10 }}>
        {CAT_ICON[item.category] ?? "🔮"}
      </div>
      <div style={{ position: "absolute", top: 10, right: 8 }}>
        <HeartBtn item={item} onToggle={onFavToggle} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.t1, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 22 }}>{item.name}</p>
      <p style={{ fontSize: 11, color: C.t2, margin: "0 0 10px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{item.description}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <CatBadge cat={item.category} />
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.gold, fontWeight: 600 }}>{stars(item.avg_rating)}</span>
      </div>
      {item.installed && (
        <div style={{ marginTop: 8 }}><InstalledBadge /></div>
      )}
    </div>
  );
}

// ─── Grid card (browse) ───────────────────────────────────────────────────────
function GridCard({ item, onClick, onFavToggle }) {
  const [hov, setHov] = useState(false);
  const cc = CAT_COLORS[item.category] ?? CAT_COLORS.Other;
  return (
    <div onClick={() => onClick(item)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.cardHv : C.card, border: `1px solid ${hov ? "rgba(124,58,237,0.3)" : C.border}`, borderRadius: 16, padding: 18, cursor: "pointer", transition: "all 0.18s" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: cc.bg, border: `1px solid ${cc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {CAT_ICON[item.category] ?? "🔮"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.t1, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.name}</p>
            <HeartBtn item={item} onToggle={onFavToggle} />
          </div>
          <p style={{ fontSize: 12, color: C.t2, margin: "0 0 10px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.45 }}>{item.description}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <TypeBadge type={item.type} />
            <CatBadge cat={item.category} />
            <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{stars(item.avg_rating)}</span>
            <span style={{ fontSize: 11, color: C.t3 }}>{fmt(item.install_count)} installs</span>
            {item.price_paise > 0 && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: C.green }}>{priceFmt(item.price_paise)}</span>}
            {item.installed && <InstalledBadge />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Carousel ─────────────────────────────────────────────────────────────────
function Carousel({ title, items, loading, onItemClick, onFavToggle }) {
  const ref = useRef(null);
  const scroll = (d) => ref.current?.scrollBy({ left: d * 220, behavior: "smooth" });
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: C.t1, margin: 0 }}>{title}</h3>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[-1, 1].map((d) => (
            <button key={d} onClick={() => scroll(d)}
              style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.t2, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {d < 0 ? "←" : "→"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ display: "flex", gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 200, height: 150, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animation: "appstore-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p style={{ color: C.t3, fontSize: 13 }}>No items yet.</p>
      ) : (
        <div ref={ref} style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {items.map((item) => (
            <CompactCard key={`${item.type}-${item.id}`} item={item} onClick={onItemClick} onFavToggle={onFavToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hero banner ──────────────────────────────────────────────────────────────
function HeroBanner({ items, onClick }) {
  const item = items?.[0];
  if (!item) return null;
  const cc = CAT_COLORS[item.category] ?? CAT_COLORS.Other;
  return (
    <div onClick={() => onClick(item)} style={{ marginBottom: 32, borderRadius: 20, padding: "32px 32px 28px", background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.12))", border: "1px solid rgba(124,58,237,0.25)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ display: "flex", gap: 20, alignItems: "center", position: "relative" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: cc.bg, border: `2px solid ${cc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>
          {CAT_ICON[item.category] ?? "🔮"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", padding: "2px 8px", borderRadius: 99 }}>⭐ Featured</span>
            <TypeBadge type={item.type} />
            <CatBadge cat={item.category} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: C.t1, margin: "0 0 6px", letterSpacing: "-0.3px" }}>{item.name}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: "0 0 12px", maxWidth: 500 }}>{item.description}</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>{stars(item.avg_rating)}</span>
            <span style={{ fontSize: 12, color: C.t3 }}>{fmt(item.install_count)} installs</span>
            {item.installed && <InstalledBadge />}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClick(item); }}
          style={{ padding: "10px 24px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", border: "none", borderRadius: 12, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onToast, onInstalled }) {
  const [detail,     setDetail]     = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installed,  setInstalled]  = useState(!!item?.installed);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const endpoint = item.type === "agent"
          ? `/api/marketplace/agents/${item.id}`
          : `/api/marketplace/templates/${item.id}`;
        const j = await fetch(endpoint).then((r) => r.json());
        if (!alive) return;
        setDetail(j[item.type]);
        setReviews(j.reviews ?? []);
        setInstalled(j[item.type]?.installed ?? !!item.installed);
      } catch { if (alive) setDetail(item); }
      if (alive) setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [item]);

  async function handleInstall(itm) {
    if (itm.price_paise > 0) {
      setInstalling(true);
      try {
        const order = await fetch("/api/razorpay/buy-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: itm.id }),
        }).then((r) => r.json());
        if (order.error) { onToast("Payment error: " + order.error); setInstalling(false); return; }
        const opts = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount, currency: order.currency,
          name: "Intellixy", description: itm.name, order_id: order.id,
          handler: async (res) => {
            const v = await fetch("/api/razorpay/verify-template-payment", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...res, template_id: itm.id }),
            }).then((r) => r.json());
            if (v.success) { setInstalled(true); onInstalled(itm); onToast("Template purchased & installed!"); }
            else onToast("Payment verification failed");
            setInstalling(false);
          },
          modal: { ondismiss: () => setInstalling(false) },
        };
        new window.Razorpay(opts).open();
      } catch { onToast("Payment failed"); setInstalling(false); }
    } else {
      setInstalling(true);
      try {
        const endpoint = itm.type === "agent"
          ? `/api/marketplace/agents/${itm.id}`
          : `/api/marketplace/templates/${itm.id}`;
        const j = await fetch(endpoint, { method: "POST" }).then((r) => r.json());
        if (j.installed) { setInstalled(true); onInstalled(itm); onToast(`${itm.type === "agent" ? "Agent" : "Template"} installed!`); }
        else onToast(j.error ?? "Install failed");
      } catch { onToast("Install failed"); }
      setInstalling(false);
    }
  }

  const d = detail ?? item;
  const cc = CAT_COLORS[d?.category] ?? CAT_COLORS.Other;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.42 }}
        onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 620, maxHeight: "88vh", overflowY: "auto", background: "linear-gradient(145deg,#0e1120,#0a0d1a)", border: "1px solid rgba(124,58,237,0.28)", borderRadius: 22, padding: "28px", boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.12)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.t2 }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: cc.bg, border: `2px solid ${cc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                {CAT_ICON[d.category] ?? "🔮"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <TypeBadge type={d.type} />
                  <CatBadge cat={d.category} />
                  {d.price_paise > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "2px 8px", borderRadius: 99 }}>
                      {priceFmt(d.price_paise)}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: C.t1, margin: "0 0 4px" }}>{d.name}</h2>
                <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>by {d.creator_name ?? "Creator"}</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.t3, fontSize: 20, padding: 4, alignSelf: "flex-start" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 20, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              {[{ v: stars(d.avg_rating), l: "Rating" }, { v: fmt(d.install_count), l: "Installs" }, { v: String(d.review_count ?? reviews.length), l: "Reviews" }].map(({ v, l }, i, a) => (
                <div key={l} style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: l === "Rating" ? C.gold : C.t1, margin: 0 }}>{v}</p>
                  <p style={{ fontSize: 10, color: C.t3, margin: 0 }}>{l}</p>
                  {i < a.length - 1 && <div style={{ position: "absolute" }} />}
                </div>
              ))}
            </div>

            <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, marginBottom: 20 }}>{d.description}</p>

            <div style={{ marginBottom: reviews.length > 0 ? 24 : 0 }}>
              {installed ? (
                <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>✓ Installed</span>
              ) : (
                <button onClick={() => handleInstall(d)} disabled={installing}
                  style={{ padding: "11px 26px", background: d.price_paise > 0 ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: installing ? "default" : "pointer", opacity: installing ? 0.7 : 1 }}>
                  {installing ? "Processing…" : d.price_paise > 0 ? `Buy ${priceFmt(d.price_paise)}` : "Install Free"}
                </button>
              )}
            </div>

            {reviews.length > 0 && (
              <>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: C.t1, margin: "0 0 12px" }}>Reviews</h4>
                {reviews.slice(0, 5).map((rv, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
                    <div style={{ marginBottom: rv.review ? 6 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span>
                    </div>
                    {rv.review && <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>{rv.review}</p>}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── My Apps view ─────────────────────────────────────────────────────────────
function MyAppsView({ onItemClick }) {
  const [tab,     setTab]     = useState("installed");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/appstore/my-apps")
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const installed = data?.installed ?? [];
  const favorites = data?.favorites ?? [];
  const recent    = data?.recent_activity ?? [];

  const TABS = [
    { id: "installed", label: `Installed (${installed.length})` },
    { id: "favorites", label: `Favorites (${favorites.length})` },
    { id: "recent",    label: "Recent Activity" },
  ];

  if (loading) return <div style={{ padding: "40px 0", color: C.t2, textAlign: "center" }}>Loading your apps…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "white" : C.t2, background: tab === t.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${tab === t.id ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "installed" && (
        installed.length === 0
          ? <EmptyState icon="📦" text="No installed apps yet — browse the store!" />
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {installed.map((item) => (
                <GridCard key={`${item.type}-${item.user_item_id}`} item={{ ...item, id: item.marketplace_id, installed: true }} onClick={onItemClick} />
              ))}
            </div>
      )}

      {tab === "favorites" && (
        favorites.length === 0
          ? <EmptyState icon="♡" text="No favorites yet — heart any app to save it here!" />
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {favorites.map((item, i) => (
                <GridCard key={`${item.type}-${item.id}-${i}`} item={{ ...item, favorited: true }} onClick={onItemClick} />
              ))}
            </div>
      )}

      {tab === "recent" && (
        recent.length === 0
          ? <EmptyState icon="🕐" text="No recent activity yet." />
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
                  <span style={{ fontSize: 18 }}>{log.action === "install" ? "📦" : log.action === "view" ? "👁" : log.action === "run" ? "▶" : "♥"}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.t1, margin: 0, textTransform: "capitalize" }}>{log.action}</p>
                    <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>{log.target_type} · {new Date(log.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, color: C.t2, margin: 0 }}>{text}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MarketplaceView({ onToast }) {
  const [view,          setView]  = useState("home");
  const [home,          setHome]  = useState(null);
  const [homeLoading,   setHL]    = useState(true);
  const [search,        setSrch]  = useState("");
  const [dSearch,       setDS]    = useState("");
  const [browseItems,   setBI]    = useState([]);
  const [browseTotal,   setBT]    = useState(0);
  const [browsePage,    setBP]    = useState(0);
  const [browseLoading, setBL]    = useState(false);
  const [hasMore,       setHM]    = useState(false);
  const [category,      setCat]   = useState("all");
  const [type,          setType]  = useState("all");
  const [sort,          setSort]  = useState("ranking");
  const [price,         setPrice] = useState("all");
  const [selected,      setSel]   = useState(null);
  const debounceRef = useRef(null);

  // Load homepage
  useEffect(() => {
    setHL(true);
    fetch("/api/appstore/home")
      .then((r) => r.json())
      .then((j) => { setHome(j); setHL(false); })
      .catch(() => setHL(false));
  }, []);

  // Debounced search input
  function onSearchChange(e) {
    setSrch(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const v = e.target.value.trim();
      setDS(v);
      if (v) { setView("browse"); setBP(0); }
    }, 350);
  }

  // Load browse page
  const loadBrowse = useCallback(async (page = 0, append = false) => {
    setBL(true);
    const params = new URLSearchParams({ sort, category, type, price, page, limit: 24 });
    if (dSearch) params.set("q", dSearch);
    try {
      const j = await fetch(`/api/appstore?${params}`).then((r) => r.json());
      if (append) setBI((prev) => [...prev, ...(j.items ?? [])]);
      else setBI(j.items ?? []);
      setBT(j.total ?? 0);
      setHM(j.has_more ?? false);
      setBP(page);
    } catch {}
    setBL(false);
  }, [sort, category, type, price, dSearch]);

  useEffect(() => {
    if (view === "browse") loadBrowse(0, false);
  }, [view, sort, category, type, price, dSearch]);

  // Optimistic favorite updates across all lists
  function handleFavToggle(item, faved) {
    const upd = (list) => list?.map((i) => i.id === item.id && i.type === item.type ? { ...i, favorited: faved } : i);
    setHome((h) => h ? { ...h, featured: upd(h.featured), trending: upd(h.trending), top_rated: upd(h.top_rated), new_releases: upd(h.new_releases), recommendations: upd(h.recommendations) } : h);
    setBI((prev) => upd(prev));
  }

  // Mark item installed across all lists
  function handleInstalled(item) {
    const upd = (list) => list?.map((i) => i.id === item.id && i.type === item.type ? { ...i, installed: true } : i);
    setHome((h) => h ? { ...h, featured: upd(h.featured), trending: upd(h.trending), top_rated: upd(h.top_rated), new_releases: upd(h.new_releases), recommendations: upd(h.recommendations) } : h);
    setBI((prev) => upd(prev));
  }

  const carouselProps = { loading: homeLoading, onItemClick: setSel, onFavToggle: handleFavToggle };

  return (
    <div style={{ minHeight: "100%", background: C.bg }}>

      {/* ── Sticky top bar ── */}
      <div style={{ padding: "18px 28px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,11,20,0.92)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>
              <span style={{ background: "linear-gradient(135deg,#a78bfa,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>App</span>
              {" "}<span style={{ color: C.t1 }}>Store</span>
            </h1>
            <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>AI agents &amp; workflow templates</p>
          </div>
          <div style={{ flex: 1, maxWidth: 440, marginLeft: "auto" }}>
            <input
              value={search}
              onChange={onSearchChange}
              onFocus={() => { if (search.trim()) setView("browse"); }}
              placeholder="Search agents, templates…"
              style={{ width: "100%", padding: "9px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.t1, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
            />
          </div>
        </motion.div>
        {/* Nav tabs — premium pill style */}
        <div style={{ display: "flex", gap: 4, padding: "4px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, width: "fit-content", marginBottom: -1 }}>
          {[{ id: "home", l: "🏠 Home" }, { id: "browse", l: "🔍 Browse" }, { id: "my-apps", l: "📦 My Apps" }].map(({ id, l }) => (
            <motion.button key={id} onClick={() => setView(id)}
              whileTap={{ scale: 0.95 }}
              style={{ padding: "7px 18px", fontSize: 13, fontWeight: view === id ? 700 : 500, color: view === id ? "#c4b5fd" : C.t2, background: view === id ? "rgba(124,58,237,0.2)" : "transparent", border: view === id ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent", borderRadius: 9, cursor: "pointer", transition: "all 0.18s" }}>
              {l}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "28px 28px 60px" }}>

        {/* HOME VIEW */}
        {view === "home" && (
          <>
            <HeroBanner items={home?.featured ?? []} onClick={setSel} />
            <Carousel title="🔥 Trending Now"       items={home?.trending        ?? []} {...carouselProps} />
            <Carousel title="⭐ Top Rated"           items={home?.top_rated       ?? []} {...carouselProps} />
            <Carousel title="🆕 New Releases"        items={home?.new_releases    ?? []} {...carouselProps} />
            <Carousel title="✨ Recommended For You" items={home?.recommendations ?? []} {...carouselProps} />
          </>
        )}

        {/* BROWSE VIEW */}
        {view === "browse" && (
          <>
            {/* Category chips */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              {CATEGORIES.map((cat) => {
                const active = cat === "All" ? category === "all" : category === cat;
                return (
                  <button key={cat} onClick={() => setCat(cat === "All" ? "all" : cat)}
                    style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.accentL : C.t2, background: active ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                    {cat !== "All" && (CAT_ICON[cat] + " ")}{cat}
                  </button>
                );
              })}
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {[{ v: "all", l: "All" }, { v: "agent", l: "Agents" }, { v: "template", l: "Templates" }].map((o) => (
                  <button key={o.v} onClick={() => setType(o.v)}
                    style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: type === o.v ? 700 : 500, color: type === o.v ? C.t1 : C.t2, background: type === o.v ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${type === o.v ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort + price + count */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: C.t3 }}>Sort:</span>
              {SORT_OPTS.map((o) => (
                <button key={o.v} onClick={() => setSort(o.v)}
                  style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: sort === o.v ? 700 : 500, color: sort === o.v ? C.t1 : C.t2, background: sort === o.v ? "rgba(255,255,255,0.1)" : "transparent", border: `1px solid ${sort === o.v ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                  {o.l}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: C.t3 }}>{browseTotal} result{browseTotal !== 1 ? "s" : ""}</span>
              {[{ v: "all", l: "All prices" }, { v: "free", l: "Free" }, { v: "paid", l: "Paid" }].map((o) => (
                <button key={o.v} onClick={() => setPrice(o.v)}
                  style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: price === o.v ? 700 : 500, color: price === o.v ? C.green : C.t2, background: price === o.v ? "rgba(16,185,129,0.1)" : "transparent", border: `1px solid ${price === o.v ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                  {o.l}
                </button>
              ))}
            </div>

            {/* Grid */}
            {browseLoading && browseItems.length === 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ height: 110, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animation: "appstore-pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            ) : browseItems.length === 0 ? (
              <EmptyState icon="🔍" text="No results found. Try a different search or filter." />
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                  {browseItems.map((item) => (
                    <GridCard key={`${item.type}-${item.id}`} item={item} onClick={setSel} onFavToggle={handleFavToggle} />
                  ))}
                </div>
                {hasMore && (
                  <div style={{ textAlign: "center", marginTop: 24 }}>
                    <button onClick={() => loadBrowse(browsePage + 1, true)} disabled={browseLoading}
                      style={{ padding: "10px 32px", borderRadius: 12, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: C.accentL, fontSize: 13, fontWeight: 600, cursor: browseLoading ? "default" : "pointer", opacity: browseLoading ? 0.7 : 1 }}>
                      {browseLoading ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* MY APPS VIEW */}
        {view === "my-apps" && (
          <MyAppsView onItemClick={setSel} />
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            key={selected.id}
            item={selected}
            onClose={() => setSel(null)}
            onToast={onToast ?? (() => {})}
            onInstalled={(item) => {
              handleInstalled(item);
              setSel((s) => s ? { ...s, installed: true } : null);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes appstore-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.75; }
        }
        .appstore-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
