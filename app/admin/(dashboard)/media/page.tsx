"use client";

import MediaLibrary from "@/components/admin/MediaLibrary";

export default function MediaPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Media Library</h1>
        <p style={{ color: '#64748B', fontSize: '0.825rem', marginTop: '0.25rem' }}>
          Upload and manage photos, branding assets, and project imagery for use across the website.
        </p>
      </div>
      <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 10, padding: '1.5rem' }}>
        <MediaLibrary />
      </div>
    </div>
  );
}
