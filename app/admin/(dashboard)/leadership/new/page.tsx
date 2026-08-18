"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = ["CEO","CTO","CHAIRMAN","COO","CFO","DIRECTOR","LEAD_ENGINEER","RESEARCHER","ADVISOR","OTHER"];

export default function NewLeadershipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", position: "CEO", department: "", shortBio: "",
    fullBio: "", email: "", linkedin: "", website: "", location: "", displayOrder: 0, isActive: true,
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setPhotoUrl(data.url);
      else setError("Photo upload failed");
    } catch { setError("Photo upload failed"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.shortBio) { setError("Name and short bio are required"); return; }
    setLoading(true); setError("");
    try {
      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const res = await fetch("/api/leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photo: photoUrl || null, slug }),
      });
      if (res.ok) {
        router.push("/admin/leadership");
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to create member");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = { width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: "6px", padding: "0.625rem 0.875rem", color: "#F8FAFC", fontSize: "0.9rem", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: "0.78rem", color: "#9CA3AF", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.06em" };
  const grp: React.CSSProperties = { marginBottom: "1.25rem" };

  return (
    <div style={{ padding: "2rem", color: "#F8FAFC", fontFamily: "system-ui", maxWidth: 800 }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>Add Leadership Member</h1>
      {error && <div style={{ background: "#7F1D1D", color: "#FCA5A5", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1.5rem" }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={grp}>
          <label style={lbl}>Profile Photo</label>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
            <div style={{ width: 110, height: 148, background: "#111827", border: "1px solid #374151", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {photoPreview ? <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#4B5563", fontSize: "0.75rem" }}>No photo</span>}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: "#374151", color: "#D1D5DB", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", marginBottom: "0.5rem", display: "block" }}>{uploading ? "Uploading..." : "Upload Photo"}</button>
              {photoPreview && <button type="button" onClick={() => { setPhotoPreview(null); setPhotoUrl(""); }} style={{ background: "transparent", color: "#9CA3AF", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>Remove photo</button>}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={grp}><label style={lbl}>Full Name *</label><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div style={grp}><label style={lbl}>Position *</label><select style={inp} value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>{POSITIONS.map(p => <option key={p} value={p}>{p.replace("_", " ")}</option>)}</select></div>
          <div style={grp}><label style={lbl}>Department</label><input style={inp} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Engineering" /></div>
          <div style={grp}><label style={lbl}>Location</label><input style={inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Islamabad, PK" /></div>
        </div>
        <div style={grp}><label style={lbl}>Short Bio * (shown on card)</label><textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.shortBio} onChange={e => setForm(f => ({ ...f, shortBio: e.target.value }))} required /></div>
        <div style={grp}><label style={lbl}>Full Biography (profile page)</label><textarea style={{ ...inp, minHeight: 140, resize: "vertical" }} value={form.fullBio} onChange={e => setForm(f => ({ ...f, fullBio: e.target.value }))} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
          <div style={grp}><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div style={grp}><label style={lbl}>LinkedIn URL</label><input style={inp} value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} /></div>
          <div style={grp}><label style={lbl}>Website URL</label><input style={inp} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={grp}><label style={lbl}>Display Order</label><input style={inp} type="number" min={0} value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} /></div>
          <div style={grp}><label style={lbl}>Status</label><select style={inp} value={form.isActive ? "active" : "inactive"} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "active" }))}><option value="active">Active (visible on site)</option><option value="inactive">Inactive (hidden)</option></select></div>
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button type="submit" disabled={loading} style={{ background: "#2563EB", color: "#fff", border: "none", padding: "0.75rem 2rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>{loading ? "Creating..." : "Create Member"}</button>
          <button type="button" onClick={() => router.push("/admin/leadership")} style={{ background: "#374151", color: "#D1D5DB", border: "none", padding: "0.75rem 1.5rem", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}