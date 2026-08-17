"use client";

import MediaLibrary from "@/components/admin/MediaLibrary";

export default function MediaPage() {
  return (
    <div style={{ padding: "2rem", color: "#f8f9fa", backgroundColor: "#0f172a", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem", borderBottom: "1px solid #334155", paddingBottom: "0.5rem" }}>
        Media Library
      </h1>
      <MediaLibrary />
    </div>
  );
}
