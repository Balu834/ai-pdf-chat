"use client";

export function Shimmer({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.6s ease-in-out infinite", ...style }} />
  );
}

export function SidebarSkeleton() {
  return (
    <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {[1,2,3,4].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 9 }}>
          <Shimmer w={16} h={16} r={4} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            <Shimmer h={11} r={5} style={{ width: `${60 + i * 8}%` }} />
            <Shimmer h={9} r={4} style={{ width: "40%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 740, margin: "0 auto" }}>
      {[false, true, false].map((isUser, i) => (
        <div key={i} style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start" }}>
          {!isUser && <Shimmer w={34} h={34} r={10} />}
          <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 5 }}>
            <Shimmer w={isUser ? 160 : 260} h={44} r={isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px"} />
            {!isUser && <Shimmer w={80} h={9} r={4} />}
          </div>
          {isUser && <Shimmer w={34} h={34} r={10} />}
        </div>
      ))}
    </div>
  );
}
