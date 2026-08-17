'use client';

import { useState } from 'react';

export default function MediaLibraryPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Mock initial state for media items
  const [mediaItems, setMediaItems] = useState<any[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(10);
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    // Simulate upload delay and progress
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 20, 90));
    }, 200);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMediaItems([data, ...mediaItems]);
      } else {
        // Mock successful upload since we don't have the API endpoint
        setTimeout(() => {
          setMediaItems([{
            id: Math.random().toString(),
            url: URL.createObjectURL(file),
            filename: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB'
          }, ...mediaItems]);
        }, 1000);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Media Library</h1>

      <div className="mb-12">
        <div className="border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center hover:border-[var(--color-primary)] transition-colors relative">
          <input 
            type="file" 
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
          />
          <div className="font-mono text-[var(--color-muted)]">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-lg mb-2">Drag and drop files here</p>
            <p className="text-sm">or click to browse</p>
          </div>
        </div>
        
        {isUploading && (
          <div className="mt-4 bg-[var(--color-surface)] p-4 border border-[var(--color-border)]">
            <div className="flex justify-between font-mono text-sm mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1 bg-[var(--color-bg)] w-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-primary)] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {mediaItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[var(--color-muted)] font-mono border border-[var(--color-border)]">
            No media files uploaded yet.
          </div>
        ) : (
          mediaItems.map((item) => (
            <div key={item.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] group relative">
              <div className="aspect-square bg-[var(--color-bg)] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 text-xs font-mono">
                <div className="truncate mb-1 font-bold" title={item.filename}>{item.filename}</div>
                <div className="text-[var(--color-muted)]">{item.size}</div>
              </div>
              <button className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                &times;
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
