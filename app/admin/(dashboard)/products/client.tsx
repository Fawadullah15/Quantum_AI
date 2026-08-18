"use client";

import React, { useState } from 'react';
import { createProduct, updateProduct, deleteProduct } from './actions';

export default function ProductsClient({ products: initialProducts }: { products: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreate = () => {
    setCurrent(null);
    setIsEditing(true);
    setMessage(null);
  };

  const handleEdit = (product: any) => {
    setCurrent(product);
    setIsEditing(true);
    setMessage(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        setMessage({ type: 'success', text: `Product "${name}" deleted successfully.` });
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to delete product.' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      if (current?.id) {
        await updateProduct(current.id, data);
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        await createProduct(data);
        setMessage({ type: 'success', text: 'Product created successfully!' });
      }
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setMessage({ type: 'error', text: 'Failed to save product: ' + (err.message || 'Unknown error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    color: '#F8FAFC',
    fontSize: '0.85rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
  };

  if (isEditing) {
    return (
      <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 10, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>
            {current ? `Edit Product: ${current.name}` : 'Create New Product'}
          </h2>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ✕ Cancel
          </button>
        </div>

        {message && (
          <div style={{
            padding: '0.65rem 1rem',
            borderRadius: 6,
            marginBottom: '1rem',
            fontSize: '0.825rem',
            backgroundColor: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: message.type === 'success' ? '#34D399' : '#F87171',
            border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Product Name *</label>
              <input name="name" defaultValue={current?.name} required placeholder="e.g. Quantum Analytics Engine" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slug (auto-generated if blank)</label>
              <input name="slug" defaultValue={current?.slug} placeholder="e.g. quantum-analytics" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input name="category" defaultValue={current?.category || 'AI Software'} placeholder="e.g. AI Platform, SaaS, Developer Tool" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" defaultValue={current?.status || 'LIVE'} style={inputStyle}>
                <option value="LIVE">LIVE</option>
                <option value="BETA">BETA</option>
                <option value="IN_DEVELOPMENT">IN DEVELOPMENT</option>
                <option value="PLANNED">PLANNED</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Display Order</label>
              <input type="number" name="order" defaultValue={current?.order || 0} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea name="description" defaultValue={current?.description || ''} required rows={3} placeholder="Comprehensive description of the product capabilities..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Technologies (comma-separated)</label>
              <input name="technologies" defaultValue={current?.technologies || ''} placeholder="Next.js, FastAPI, PyTorch, Docker" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hero Image URL (optional)</label>
              <input name="heroImage" defaultValue={current?.heroImage || ''} placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Demo URL (optional)</label>
              <input name="demoUrl" defaultValue={current?.demoUrl || ''} placeholder="https://demo.quantumai.dev" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Docs URL (optional)</label>
              <input name="docsUrl" defaultValue={current?.docsUrl || ''} placeholder="https://docs.quantumai.dev" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <input type="checkbox" name="published" id="published" value="true" defaultChecked={current ? current.published : true} style={{ width: 16, height: 16, accentColor: '#1677FF', cursor: 'pointer' }} />
            <label htmlFor="published" style={{ fontSize: '0.85rem', color: '#F1F5F9', cursor: 'pointer' }}>
              Published (visible immediately on public site)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #1E293B', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              style={{ padding: '0.55rem 1.25rem', backgroundColor: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#94A3B8', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '0.55rem 1.5rem', backgroundColor: '#2563EB', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Saving...' : (current ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0B111E', borderRadius: 10, border: '1px solid #1E293B', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090E1A', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', margin: 0 }}>All Products</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0' }}>{products.length} total software products</p>
        </div>
        <button
          onClick={handleCreate}
          style={{ padding: '0.45rem 1rem', backgroundColor: '#2563EB', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          + Add Product
        </button>
      </div>

      {message && (
        <div style={{
          padding: '0.65rem 1.25rem',
          fontSize: '0.825rem',
          backgroundColor: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: message.type === 'success' ? '#34D399' : '#F87171',
          borderBottom: '1px solid #1E293B'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#64748B', borderBottom: '1px solid #1E293B' }}>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Order</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Visibility</th>
              <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                  No products created yet. Click "+ Add Product" to add your first software offering.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{product.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>/{product.slug}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94A3B8' }}>{product.category}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: '#38BDF8',
                    }}>
                      {product.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{product.order}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      backgroundColor: product.published ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      color: product.published ? '#34D399' : '#FBBF24',
                    }}>
                      {product.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{ background: '#334155', border: 'none', color: '#F1F5F9', padding: '0.25rem 0.55rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#F87171', padding: '0.25rem 0.55rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Delete
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
