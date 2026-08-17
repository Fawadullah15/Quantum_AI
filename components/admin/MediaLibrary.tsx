"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, Trash2, Copy, Eye, X, Image as ImageIcon } from "lucide-react";

type Media = {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  createdAt: string;
};

export default function MediaLibrary() {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (err) {
      console.error("Failed to fetch media", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError("Upload failed: File is larger than 10MB limit");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const newMedia = await res.json();
      setMedia([newMedia, ...media]);
      setShowUploader(false);
      setSelectedFile(null);
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMedia(media.filter((m) => m.id !== id));
      } else {
        alert("Failed to delete media");
      }
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Error deleting media");
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Copied URL to clipboard!");
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowUploader(!showUploader)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.875rem",
          }}
        >
          {showUploader ? <X size={18} /> : <UploadCloud size={18} />}
          {showUploader ? "Cancel Upload" : "Upload Media"}
        </button>
      </div>

      {showUploader && (
        <div
          style={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "0.5rem",
            padding: "1.5rem",
          }}
        >
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: "2px dashed #475569",
              borderRadius: "0.5rem",
              padding: "2rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#0f172a",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept="image/*,video/*,application/pdf"
            />
            {selectedFile ? (
              <div style={{ color: "#e2e8f0" }}>
                <ImageIcon size={32} style={{ margin: "0 auto", marginBottom: "0.5rem", color: "#94a3b8" }} />
                <p style={{ fontWeight: "500" }}>{selectedFile.name}</p>
                <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>{formatBytes(selectedFile.size)}</p>
              </div>
            ) : (
              <div style={{ color: "#94a3b8" }}>
                <UploadCloud size={32} style={{ margin: "0 auto", marginBottom: "0.5rem" }} />
                <p>Drag and drop a file here, or click to select</p>
                <p style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>Max size: 10MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "1rem" }}>{uploadError}</p>
          )}

          {selectedFile && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  backgroundColor: isUploading ? "#475569" : "#3b82f6",
                  color: "white",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ height: "200px", backgroundColor: "#1e293b", borderRadius: "0.5rem", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "#1e293b", borderRadius: "0.5rem", border: "1px solid #334155" }}>
          <ImageIcon size={48} style={{ margin: "0 auto", marginBottom: "1rem", color: "#475569" }} />
          <h3 style={{ color: "#f8f9fa", fontSize: "1.125rem", fontWeight: "500" }}>No media uploaded yet</h3>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Upload your first image or file to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {media.map((item) => (
            <div
              key={item.id}
              className="media-card"
              style={{
                position: "relative",
                backgroundColor: "#1e293b",
                borderRadius: "0.5rem",
                overflow: "hidden",
                border: "1px solid #334155",
                display: "flex",
                flexDirection: "column",
                height: "220px",
              }}
            >
              <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
                {item.type.startsWith("image/") ? (
                  <img src={item.url} alt={item.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ color: "#475569" }}>{item.type}</div>
                )}
              </div>
              <div style={{ padding: "0.75rem", backgroundColor: "#1e293b" }}>
                <p style={{ color: "#f8f9fa", fontSize: "0.875rem", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.filename}
                </p>
                <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  {formatBytes(item.size)}
                </p>
              </div>

              <div
                className="media-card-actions"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  padding: "0.5rem",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "white", backgroundColor: "rgba(255,255,255,0.2)", padding: "0.25rem", borderRadius: "0.25rem", cursor: "pointer" }}
                  title="View"
                >
                  <Eye size={16} />
                </a>
                <button
                  onClick={() => copyToClipboard(item.url)}
                  style={{ color: "white", backgroundColor: "rgba(255,255,255,0.2)", padding: "0.25rem", borderRadius: "0.25rem", cursor: "pointer", border: "none" }}
                  title="Copy URL"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ color: "#ef4444", backgroundColor: "rgba(255,255,255,0.2)", padding: "0.25rem", borderRadius: "0.25rem", cursor: "pointer", border: "none" }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .media-card:hover .media-card-actions {
          opacity: 1 !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}} />
    </div>
  );
}
