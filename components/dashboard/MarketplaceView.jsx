"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Productivity", "Finance", "Legal", "Education", "Other"];
const SORTS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating",  label: "Top Rated" },
  { value: "new",     label: "Newest" },
];
const CATEGORY_COLORS = {
  Productivity: { bg: "#7c3aed22", border: "#7c3aed44", text: "#a78bfa" },
  Finance:      { bg: "#10b98122", border: "#10b98144", text: "#34d399" },
  Legal:        { bg: "#3b82f622", border: "#3b82f644", text: "#60a5fa" },
  Education:    { bg: "#f59e0b22", border: "#f59e0b44", text: "#fbbf24" },
  Other:        { bg: "#64748b22", border: "#64748b44", text: "#94a3b8" },
};
const CATEGORY_ICONS = { Productivity: "⚙️", Finance: "💰", Legal: "⚖️", Education: "📚", Other: "🔮" };
const TOOL_ICON = { summarize_pdf: "📄", extract_fields: "🔍", send_email: "✉️", call_webhook: "🔗" };

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  wrap:  { padding: "24px 28px", maxWidth: 1100, margin: "0 auto" },
  hdr:   { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: 0 },
  sub:   { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  bar:   { display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" },
  search: {
    flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#f1f5f9", fontSize: 13, outline: "none",
  },
  select: {
    padding: "9px 12px", borderRadius: 10,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#f1f5f9", fontSize: 13, outline: "none", cursor: "pointer",
  },
  tabs: { display: "flex", gap: 4, padding: "4px", background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 18, width: "fit-content" },
  tab: {
    padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
    border: "none", transition: "all 0.15s",
  },
  chips: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 },
  chip: {
    padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: "pointer", border: "1px solid", transition: "all 0.12s",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  card: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.18s",
    display: "flex", flexDirection: "column", gap: 12,
  },
  cardName: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 },
  cardDesc: { fontSize: 12, color: "#94a3b8", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  pill: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  stars: { display: "flex", alignItems: "center", gap: 3, fontSize: 12 },
  btn: { padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.15s" },
  btnPrimary: { background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff" },
  btnSuccess: { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
  btnGold:    { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff" },
  btnGhost:   { background: "rgba(255,255,255,0.06)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 32, width: "90%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" },
  empty: { gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#64748b" },
};

// ── Helper components ─────────────────────────────────────────────────────────

function Stars({ rating, count }) {
  const full = Math.round(rating);
  return (
    <div style={s.stars}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ color: i <= full ? "#f59e0b" : "#334155", fontSize: 13 }}>★</span>
      ))}
      <span style={{ color: "#94a3b8", fontSize: 11 }}>{rating > 0 ? rating.toFixed(1) : "New"}</span>
      {count > 0 && <span style={{ color: "#64748b", fontSize: 11 }}>({count})</span>}
    </div>
  );
}

function PriceBadge({ price_paise }) {
  if (price_paise === 0)
    return <span style={{ ...s.pill, background: "rgba(16,185,129,0.15)", color: "#10b981" }}>FREE</span>;
  return <span style={{ ...s.pill, background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>₹{price_paise / 100}</span>;
}

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
  return (
    <span style={{ ...s.pill, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {CATEGORY_ICONS[category]} {category}
    </span>
  );
}

function ReviewItem({ review }) {
  const full = Math.round(review.rating);
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {[1,2,3,4,5].map((i) => <span key={i} style={{ color: i <= full ? "#f59e0b" : "#334155", fontSize: 12 }}>★</span>)}
        <span style={{ fontSize: 11, color: "#64748b" }}>{new Date(review.created_at).toLocaleDateString()}</span>
      </div>
      {review.review && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{review.review}</p>}
    </div>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({ item, tab, onClose, onInstall, installing }) {
  const [reviews, setReviews]   = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail]     = useState(null);
  const isTemplate = tab === "templates";

  useEffect(() => {
    const url = isTemplate
      ? `/api/marketplace/templates/${item.id}`
      : `/api/marketplace/agents/${item.id}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setDetail(d[isTemplate ? "template" : "agent"]); setReviews(d.reviews ?? []); });
  }, [item.id, isTemplate, tab]);

  const handleReview = async () => {
    if (!myRating) return;
    setSubmitting(true);
    const url = isTemplate
      ? `/api/marketplace/templates/${item.id}/reviews`
      : `/api/marketplace/agents/${item.id}/reviews`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: myRating, review: myReview }),
    });
    setSubmitting(false);
    const res = await fetch(url);
    const d = await res.json();
    setReviews(d.reviews ?? []);
    setMyRating(0);
    setMyReview("");
  };

  const installItem = detail ?? item;

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {isTemplate ? "⚡" : "🤖"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>{item.name}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <CategoryBadge category={item.category} />
              {isTemplate && <PriceBadge price_paise={item.price_paise} />}
              <Stars rating={item.avg_rating ?? 0} count={item.review_count ?? 0} />
            </div>
          </div>
          <button style={{ ...s.btn, ...s.btnGhost, padding: "5px 10px" }} onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16, lineHeight: 1.6 }}>
          {item.description || "No description provided."}
        </p>

        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
          By <span style={{ color: "#a78bfa" }}>{item.creator_name}</span>
          {detail?.creator_bio && <span> · {detail.creator_bio}</span>}
          &nbsp;· {item.install_count} installs
        </div>

        {/* Tools (agents) or Steps (templates) */}
        {!isTemplate && item.tools?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tools</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.tools.map((t) => (
                <span key={t} style={{ ...s.pill, background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}>
                  {TOOL_ICON[t] ?? "🔧"} {t.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {isTemplate && detail?.steps?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Steps ({detail.steps.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {detail.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", fontSize: 12 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(124,58,237,0.15)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                  <span style={{ color: "#cbd5e1", textTransform: "capitalize" }}>{step.type?.replace(/_/g, " ") ?? "Step"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Install / Buy button */}
        <div style={{ marginBottom: 24 }}>
          {installItem.installed ? (
            <button style={{ ...s.btn, ...s.btnSuccess, width: "100%", padding: "11px" }}>✓ Installed</button>
          ) : (
            <button
              style={{ ...s.btn, ...(isTemplate && item.price_paise > 0 ? s.btnGold : s.btnPrimary), width: "100%", padding: "11px", opacity: installing ? 0.7 : 1 }}
              onClick={() => onInstall(item)}
              disabled={installing}
            >
              {installing ? "Installing…" : isTemplate && item.price_paise > 0 ? `Buy for ₹${item.price_paise / 100}` : "Install Free"}
            </button>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>Reviews</div>
          {reviews.length === 0 ? (
            <p style={{ fontSize: 12, color: "#64748b" }}>No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => <ReviewItem key={r.id ?? r.created_at} review={r} />)
          )}

          {/* Submit review (only if installed) */}
          {(installItem.installed) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Leave a review</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[1,2,3,4,5].map((i) => (
                  <button key={i} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: i <= myRating ? "#f59e0b" : "#334155" }} onClick={() => setMyRating(i)}>★</button>
                ))}
              </div>
              <textarea
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#f1f5f9", fontSize: 12, boxSizing: "border-box", outline: "none", resize: "vertical", minHeight: 60 }}
                placeholder="Write a review (optional)..."
                value={myReview}
                onChange={(e) => setMyReview(e.target.value)}
              />
              <button
                style={{ ...s.btn, ...s.btnPrimary, marginTop: 8, opacity: (submitting || !myRating) ? 0.6 : 1 }}
                onClick={handleReview}
                disabled={submitting || !myRating}
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function MarketplaceView({ onToast }) {
  const [tab,      setTab]      = useState("agents");      // "agents" | "templates"
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [price,    setPrice]    = useState("all");         // templates only
  const [sort,     setSort]     = useState("popular");
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [preview,  setPreview]  = useState(null);
  const [installing, setInstalling] = useState(null);      // id being installed
  const [installed,  setInstalled]  = useState(new Set()); // optimistic tracking
  const rzpRef = useRef(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (search)           params.set("search", search);
    if (category !== "All") params.set("category", category);
    if (tab === "templates" && price !== "all") params.set("price", price);

    const url = `/api/marketplace/${tab}?${params}`;
    const res = await fetch(url);
    const data = await res.json();
    const list = tab === "agents" ? (data.agents ?? []) : (data.templates ?? []);
    setItems(list);
    setInstalled(new Set(list.filter((i) => i.installed).map((i) => i.id)));
    setLoading(false);
  }, [tab, search, category, price, sort]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Load Razorpay script
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const handleInstall = async (item) => {
    if (installed.has(item.id)) return;
    setInstalling(item.id);

    if (tab === "templates" && item.price_paise > 0 && !item.purchased) {
      // Paid template — trigger Razorpay
      try {
        const res = await fetch("/api/razorpay/buy-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: item.id }),
        });
        const order = await res.json();
        if (!res.ok) throw new Error(order.error);

        const options = {
          key:      order.key_id,
          amount:   order.amount,
          currency: order.currency,
          name:     "Intellixy Marketplace",
          description: order.template.name,
          order_id: order.order_id,
          handler: async (response) => {
            const vres = await fetch("/api/razorpay/verify-template-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                template_id: item.id,
              }),
            });
            const vdata = await vres.json();
            setInstalling(null);
            if (vdata.success) {
              setInstalled((prev) => new Set([...prev, item.id]));
              onToast?.(`Purchased and installed "${item.name}"!`);
              if (preview?.id === item.id) setPreview((p) => ({ ...p, installed: true, purchased: true }));
            } else {
              onToast?.("Payment verification failed");
            }
          },
          modal: { ondismiss: () => setInstalling(null) },
          theme: { color: "#7c3aed" },
        };

        rzpRef.current = new window.Razorpay(options);
        rzpRef.current.open();
        return;
      } catch (err) {
        onToast?.(err.message || "Payment failed");
        setInstalling(null);
        return;
      }
    }

    // Free agent or free template
    const url = tab === "agents"
      ? `/api/marketplace/agents/${item.id}`
      : `/api/marketplace/templates/${item.id}`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    setInstalling(null);

    if (data.installed) {
      setInstalled((prev) => new Set([...prev, item.id]));
      onToast?.(`"${item.name}" installed successfully`);
      if (preview?.id === item.id) setPreview((p) => ({ ...p, installed: true }));
    } else {
      onToast?.(data.error || "Install failed");
    }
  };

  const openPreview = (item) => setPreview(item);

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.hdr}>
        <h2 style={s.title}>Marketplace</h2>
        <p style={s.sub}>Discover AI agents and workflow templates built by the community</p>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[["agents", "🤖 AI Agents"], ["templates", "⚡ Workflow Templates"]].map(([v, l]) => (
          <button key={v} style={{
            ...s.tab,
            background: tab === v ? "rgba(124,58,237,0.25)" : "transparent",
            color: tab === v ? "#a78bfa" : "#94a3b8",
            border: tab === v ? "1px solid rgba(124,58,237,0.35)" : "1px solid transparent",
          }} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* Search + sort */}
      <div style={s.bar}>
        <input
          style={s.search}
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {tab === "templates" && (
          <select style={s.select} value={price} onChange={(e) => setPrice(e.target.value)}>
            <option value="all">All prices</option>
            <option value="free">Free only</option>
            <option value="paid">Paid only</option>
          </select>
        )}
        <select style={s.select} value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {/* Category chips */}
      <div style={s.chips}>
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const c = CATEGORY_COLORS[cat] ?? { bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.3)", text: "#a78bfa" };
          return (
            <button key={cat} style={{
              ...s.chip,
              background: active ? c.bg : "rgba(255,255,255,0.04)",
              borderColor: active ? c.border : "rgba(255,255,255,0.1)",
              color: active ? c.text : "#94a3b8",
            }} onClick={() => setCategory(cat)}>
              {cat !== "All" && CATEGORY_ICONS[cat]} {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ ...s.grid }}>
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} style={{ ...s.card, minHeight: 200, animation: "pulse 1.5s ease-in-out infinite" }}>
              <div style={{ height: 14, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ height: 10, width: "90%", borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
              <div style={{ height: 10, width: "75%", borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={s.grid}>
          {items.length === 0 && (
            <div style={s.empty}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ color: "#94a3b8" }}>No {tab} found matching your filters</div>
            </div>
          )}
          {items.map((item) => {
            const isInstalled = installed.has(item.id);
            const isPaid = tab === "templates" && item.price_paise > 0;
            const alreadyPurchased = item.purchased;
            const catColors = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.Other;

            return (
              <div
                key={item.id}
                style={s.card}
                onClick={() => openPreview(item)}
                onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid rgba(124,58,237,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: catColors.bg, border: `1px solid ${catColors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {tab === "agents" ? "🤖" : "⚡"}
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {tab === "templates" && <PriceBadge price_paise={item.price_paise} />}
                  </div>
                </div>

                {/* Info */}
                <div>
                  <div style={{ ...s.cardName, marginBottom: 4 }}>{item.name}</div>
                  <div style={s.cardDesc}>{item.description || "No description provided."}</div>
                </div>

                {/* Category + creator */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CategoryBadge category={item.category} />
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>by {item.creator_name}</div>

                {/* Rating + installs */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Stars rating={item.avg_rating ?? 0} count={item.review_count ?? 0} />
                  <span style={{ fontSize: 11, color: "#64748b" }}>{item.install_count} installs</span>
                </div>

                {/* Action button */}
                <button
                  style={{
                    ...s.btn,
                    ...(isInstalled ? s.btnSuccess : isPaid && !alreadyPurchased ? s.btnGold : s.btnPrimary),
                    width: "100%",
                    padding: "9px",
                    opacity: installing === item.id ? 0.7 : 1,
                  }}
                  onClick={(e) => { e.stopPropagation(); handleInstall(item); }}
                  disabled={installing === item.id || isInstalled}
                >
                  {installing === item.id ? "Installing…"
                    : isInstalled ? "✓ Installed"
                    : isPaid && !alreadyPurchased ? `Buy ₹${item.price_paise / 100}`
                    : "Install Free"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          item={preview}
          tab={tab}
          onClose={() => setPreview(null)}
          onInstall={handleInstall}
          installing={installing === preview.id}
        />
      )}
    </div>
  );
}
