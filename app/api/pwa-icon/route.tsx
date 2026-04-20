import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const size = Math.min(
    512,
    Math.max(16, parseInt(request.nextUrl.searchParams.get("size") ?? "192", 10))
  );

  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.38);
  const letterSize = Math.round(size * 0.42);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Subtle inner glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18) 0%, transparent 65%)",
          }}
        />
        {/* PDF icon — simplified document shape */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: Math.round(size * 0.03),
          }}
        >
          <span
            style={{
              fontSize: letterSize,
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontFamily: "sans-serif",
            }}
          >
            I
          </span>
          <span
            style={{
              fontSize: Math.round(fontSize * 0.28),
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
            }}
          >
            PDF
          </span>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
