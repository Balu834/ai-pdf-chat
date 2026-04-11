"use client";

import { useState } from "react";

/**
 * DemoVideo — click-to-play YouTube embed.
 *
 * Usage:
 *   <DemoVideo videoId="YOUR_YOUTUBE_VIDEO_ID" />
 *
 * To find your video ID:
 *   YouTube URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   Video ID   :                                  ^^^^^^^^^^^
 */
export default function DemoVideo({ videoId }) {
  const [playing, setPlaying] = useState(false);

  // Thumbnail URL — YouTube provides this for free, no API key needed
  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  if (playing) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          aspectRatio: "16/9",
          background: "#000",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          border: "1px solid rgba(124,58,237,0.35)",
        }}
      >
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title="Intellixy Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setPlaying(true)}
      className="relative w-full overflow-hidden rounded-2xl cursor-pointer group"
      style={{
        aspectRatio: "16/9",
        background: "#000",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt="Demo video thumbnail"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ opacity: 0.75 }}
        onError={(e) => {
          // Fall back to hq thumbnail if maxres isn't available
          if (!e.target.src.includes("hqdefault")) {
            e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        }}
      />

      {/* Dark gradient over thumbnail */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg,rgba(7,7,26,0.55),rgba(124,58,237,0.25))",
        }}
      />

      {/* Play button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
        <div
          className="flex items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
          style={{
            width: 72,
            height: 72,
            background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
            boxShadow:
              "0 16px 48px rgba(124,58,237,0.55), 0 0 0 14px rgba(124,58,237,0.12)",
          }}
        >
          {/* Offset the triangle slightly right so it looks centred */}
          <svg
            width="26"
            height="26"
            fill="white"
            viewBox="0 0 24 24"
            style={{ marginLeft: 3 }}
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>

        <p
          className="text-sm font-semibold px-4 py-1.5 rounded-full"
          style={{
            color: "rgba(255,255,255,0.85)",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          ▶ Watch demo — 60 seconds
        </p>
      </div>

      {/* Duration pill — bottom right */}
      <div
        className="absolute bottom-3 right-3 text-xs font-bold px-2 py-0.5 rounded"
        style={{
          background: "rgba(0,0,0,0.75)",
          color: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(4px)",
        }}
      >
        1:00
      </div>
    </div>
  );
}
