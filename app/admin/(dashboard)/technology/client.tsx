'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { deleteTechnology } from './actions';

export default function TechnologyClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setDeletingId(id);
      try {
        await deleteTechnology(id);
        setData(prev => prev.filter(item => item.id !== id));
      } catch (err: any) {
        alert(err?.message || 'Failed to delete technology');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div style={{ color: '#F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Technologies</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage core engineering architecture and public technology detail pages.
          </p>
        </div>
        <Link
          href="/admin/technology/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            backgroundColor: '#1677FF',
            color: '#FFFFFF',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          + Add Technology
        </Link>
      </div>

      <div style={{ backgroundColor: '#0B132B', borderRadius: '12px', border: '1px solid #1E293B', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B' }}>
              <th style={{ padding: '1rem', color: '#94A3B8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
              <th style={{ padding: '1rem', color: '#94A3B8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
              <th style={{ padding: '1rem', color: '#94A3B8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CTA Status</th>
              <th style={{ padding: '1rem', color: '#94A3B8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '1rem', color: '#94A3B8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                  No technologies found. Click "+ Add Technology" to create one.
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B' }}>/technologies/{item.slug}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#1E293B', color: '#38BDF8', fontWeight: 500 }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {item.ctaTitle || item.ctaText ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#34D399', fontSize: '0.8125rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                        Configured
                      </span>
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>Default</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      backgroundColor: item.published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: item.published ? '#34D399' : '#F87171',
                    }}>
                      {item.published ? 'Published' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Link
                        href={`/technologies/${item.slug}`}
                        target="_blank"
                        style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.8125rem' }}
                      >
                        View ↗
                      </Link>
                      <Link
                        href={`/admin/technology/${item.id}/edit`}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#1E293B',
                          color: '#38BDF8',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={deletingId === item.id}
                        style={{
                          background: 'transparent',
                          color: '#EF4444',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
