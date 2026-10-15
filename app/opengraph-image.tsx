import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const alt = "GripArc — Your Calisthenics Journey Starts Here";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#111411",
        padding: "64px 80px",
        color: "#f4f5ee",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 35, fontWeight: 800 }}>
        ↗ GripArc<span style={{ color: "#c4ef6c" }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 76,
          fontWeight: 800,
          letterSpacing: "-4px",
          lineHeight: 1.05,
        }}
      >
        <span>Your Calisthenics</span>
        <span>
          Journey Starts <span style={{ color: "#c4ef6c" }}>Here.</span>
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#b1b7a8",
          fontSize: 22,
        }}
      >
        <span>SMALL STEPS. REAL STRENGTH.</span>
        <span>COMING TO iOS · FREE EARLY ACCESS</span>
      </div>
    </div>,
    size,
  );
}
