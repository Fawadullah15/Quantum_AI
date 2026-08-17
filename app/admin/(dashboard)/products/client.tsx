"use client";

import { useState } from 'react';
import { createProduct, updateProduct, deleteProduct } from './actions';

export default function ProductsClient({ products }: { products: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', category: '', status: '', 
    heroImage: '', demoUrl: '', docsUrl: '', technologies: '', 
    published: false, order: 0
  });

  const handleOpen = (product?: any) => {
    if (product) {
      setEditId(product.id);
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        category: product.category || '',
        status: product.status || '',
        heroImage: product.heroImage || '',
        demoUrl: product.demoUrl || '',
        docsUrl: product.docsUrl || '',
        technologies: Array.isArray(product.technologies) ? product.technologies.join(', ') : '',
        published: product.published || false,
        order: product.order || 0
      });
    } else {
      setEditId(null);
      setFormData({
        name: '', slug: '', description: '', category: '', status: '', 
        heroImage: '', demoUrl: '', docsUrl: '', technologies: '', 
        published: false, order: 0
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updateProduct(editId, formData);
    } else {
      await createProduct(formData);
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Products List</h2>
        <button 
          onClick={() => handleOpen()} 
          style={{ backgroundColor: '#1677FF', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
        >
          Add Product
        </button>
      </div>

      <div style={{ backgroundColor: '#1f2937', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151', backgroundColor: '#111827' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>Slug</th>
              <th style={{ padding: '0.75rem 1rem' }}>Category</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Published</th>
              <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #374151' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{product.name}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{product.slug}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{product.category}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{product.status}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{product.published ? 'Yes' : 'No'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button onClick={() => handleOpen(product)} style={{ marginRight: '0.5rem', color: '#1677FF', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(product.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem', width: '100%', maxWidth: '32rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{editId ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Slug</label>
                <input required type="text" name="slug" value={formData.slug} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Status</label>
                <input type="text" name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Hero Image URL</label>
                <input type="text" name="heroImage" value={formData.heroImage} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Demo URL</label>
                <input type="text" name="demoUrl" value={formData.demoUrl} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Docs URL</label>
                <input type="text" name="docsUrl" value={formData.docsUrl} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Technologies (comma separated)</label>
                <input type="text" name="technologies" value={formData.technologies} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Order</label>
                <input type="number" name="order" value={formData.order} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #374151', backgroundColor: '#111827', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="published" checked={formData.published} onChange={handleChange} id="published" />
                <label htmlFor="published" style={{ fontSize: '0.875rem' }}>Published</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#374151', color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#1677FF', color: 'white', border: 'none', cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
