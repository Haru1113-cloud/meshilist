"use client";

export default function RecipesPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#fffdf7",
        color: "#333",
        fontFamily: "sans-serif",
      }}
    >
      <span style={{ fontSize: 64 }}>🚧</span>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>レシピ集 工事中</h1>
      <p style={{ fontSize: 15, color: "#888", margin: 0 }}>現在準備中です。もう少しお待ちください。</p>
    </div>
  );
}
