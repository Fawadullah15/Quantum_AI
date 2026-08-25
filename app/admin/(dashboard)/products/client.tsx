'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import { createProduct, updateProduct, deleteProduct } from './actions';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  heroImage?: string | null;
  demoUrl?: string | null;
  docsUrl?: string | null;
  technologies: string;
  published: boolean;
  order: number;
  features?: { id?: string; title: string; description: string; order?: number }[];
}

export default function ProductsClient({ products: initialProducts }: { products: ProductItem[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'AI Software',
    status: 'LIVE',
    heroImage: '',
    demoUrl: '',
    docsUrl: '',
    technologies: 'Next.js, Python, PostgreSQL',
    published: true,
    order: 0,
    features: [{ title: '', description: '' }],
  });

  const handleCreate = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 'AI Software',
      status: 'LIVE',
      heroImage: '',
      demoUrl: '',
      docsUrl: '',
      technologies: 'Next.js, Python, PostgreSQL, PyTorch',
      published: true,
      order: products.length + 1,
      features: [{ title: 'Autonomous Decision Engine', description: 'Real-time neural inference pipeline.' }],
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleEdit = (product: ProductItem) => {
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      category: product.category || 'AI Software',
      status: product.status || 'LIVE',
      heroImage: product.heroImage || '',
      demoUrl: product.demoUrl || '',
      docsUrl: product.docsUrl || '',
      technologies: product.technologies || '',
      published: product.published ?? true,
      order: product.order || 0,
      features:
        product.features && product.features.length > 0
          ? product.features.map((f) => ({ title: f.title, description: f.description }))
          : [{ title: '', description: '' }],
    });
    setCurrentId(product.id);
    setIsEditing(true);
  };

  const handleNameChange = (val: string) => {
    const autoSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: !currentId ? autoSlug : prev.slug,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) throw new Error('Upload failed');

      const result = await res.json();
      if (result.url) {
        setFormData((prev) => ({ ...prev, heroImage: result.url }));
        toast.success('Product image uploaded successfully!', 'Asset Ready');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image.', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async (product: ProductItem) => {
    const newStatus = !product.published;
    try {
      await updateProduct(product.id, {
        published: newStatus,
      });
      setProducts((prev) =>
        prev.map((s) => (s.id === product.id ? { ...s, published: newStatus } : s))
      );
      toast.success(
        `"${product.name}" is now ${newStatus ? 'Live on /products' : 'Hidden in Drafts'}`,
        'Visibility Updated'
      );
      router.refresh();
    } catch (err) {
      toast.error('Failed to update status.', 'Error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const newItems = [...products];
    const itemA = newItems[index];
    const itemB = newItems[targetIndex];

    const tempOrder = itemA.order;
    itemA.order = itemB.order;
    itemB.order = tempOrder;

    newItems[index] = itemB;
    newItems[targetIndex] = itemA;

    setProducts(newItems);

    try {
      await Promise.all([
        updateProduct(itemA.id, { order: itemA.order }),
        updateProduct(itemB.id, { order: itemB.order }),
      ]);
      toast.info('Product order updated.', 'Reordered');
      router.refresh();
    } catch (err) {
      toast.error('Failed to save order.', 'Error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((s) => s.id !== id));
        toast.success(`"${name}" was deleted.`, 'Deleted');
        router.refresh();
      } catch (err) {
        toast.error('Failed to delete product.', 'Error');
      }
    }
  };

  const addFeatureRow = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, { title: '', description: '' }],
    }));
  };

  const removeFeatureRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeatureRow = (index: number, field: 'title' | 'description', value: string) => {
    setFormData((prev) => {
      const updated = [...prev.features];
      updated[index][field] = value;
      return { ...prev, features: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Please enter a product name', 'Validation');
      return;
    }

    try {
      setIsSubmitting(true);
      if (currentId) {
        const updated = await updateProduct(currentId, formData);
        setProducts((prev) =>
          prev.map((s) => (s.id === currentId ? (updated as ProductItem) : s))
        );
        toast.success(`Product "${formData.name}" updated!`, 'Saved');
      } else {
        const created = await createProduct(formData);
        setProducts((prev) => [...prev, created as ProductItem]);
        toast.success(`Product "${formData.name}" created!`, 'Created');
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save product', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q) ||
      product.technologies.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && product.published) ||
      (statusFilter === 'DRAFT' && !product.published);

    const matchesStage = stageFilter === 'ALL' || product.status === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(22, 119, 255, 0.22)',
    borderRadius: 6,
    color: '#F8FAFC',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-mono, monospace)',
  };

  return (
    <div style={{ color: '#F8FAFC', width: '100%' }}>
      {!isEditing ? (
        <>
          {/* Top Controls Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '260px', maxWidth: '640px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search product name, category, tech stack..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070B14',
                    border: '1px solid rgba(22, 119, 255, 0.25)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.95rem',
                    fontSize: '0.85rem',
                    color: '#F8FAFC',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                style={{
                  backgroundColor: '#070B14',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#CBD5E1',
                  outline: 'none',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                <option value="ALL">All Stages</option>
                <option value="LIVE">Live in Production</option>
                <option value="BETA">Private Beta</option>
                <option value="IN_DEVELOPMENT">In Development</option>
                <option value="PLANNED">Planned</option>
              </select>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      backgroundColor: statusFilter === st ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                      border: statusFilter === st ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.18)',
                      color: statusFilter === st ? '#FFFFFF' : '#94A3B8',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <Link
                href="/products"
                target="_blank"
                style={{
                  backgroundColor: 'rgba(22, 119, 255, 0.12)',
                  border: '1px solid rgba(22, 119, 255, 0.25)',
                  color: '#38BDF8',
                  padding: '0.55rem 1rem',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                <span>View Public Page</span>
                <span>↗</span>
              </Link>

              <button
                type="button"
                onClick={handleCreate}
                style={{
                  backgroundColor: '#1677FF',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                <span>+</span> NEW PRODUCT
              </button>
            </div>
          </div>

          {/* Products List Table */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products found"
              description={
                searchQuery || statusFilter !== 'ALL' || stageFilter !== 'ALL'
                  ? 'No products match your active search and filter criteria.'
                  : 'Add software products and proprietary tools to feature them on the public /products directory.'
              }
              action={
                <button
                  type="button"
                  onClick={handleCreate}
                  style={{
                    backgroundColor: '#1677FF',
                    color: '#FFFFFF',
                    padding: '0.5rem 1.15rem',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  + Add First Product
                </button>
              }
            />
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.75)',
                border: '1px solid rgba(22, 119, 255, 0.18)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(3, 7, 18, 0.8)', borderBottom: '1px solid rgba(22, 119, 255, 0.18)' }}>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', width: '70px' }}>
                        Order
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Product Name &amp; URL
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Category &amp; Stage
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Tech Stack
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Live Status
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr key={product.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                        {/* Order Controls */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <button
                              type="button"
                              title="Move up"
                              disabled={index === 0}
                              onClick={() => handleMoveOrder(index, 'UP')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: index === 0 ? '#334155' : '#38BDF8',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                padding: 0,
                              }}
                            >
                              ▲
                            </button>
                            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#94A3B8', minWidth: '16px', textAlign: 'center' }}>
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              title="Move down"
                              disabled={index === filteredProducts.length - 1}
                              onClick={() => handleMoveOrder(index, 'DOWN')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: index === filteredProducts.length - 1 ? '#334155' : '#38BDF8',
                                cursor: index === filteredProducts.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                padding: 0,
                              }}
                            >
                              ▼
                            </button>
                          </div>
                        </td>

                        {/* Title & Slug */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            {product.heroImage ? (
                              <div
                                style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                }}
                              >
                                <Image
                                  src={product.heroImage}
                                  alt={product.name}
                                  fill
                                  sizes="44px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(22, 119, 255, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.1rem',
                                  flexShrink: 0,
                                }}
                              >
                                📦
                              </div>
                            )}

                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.92rem' }}>
                                {product.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                <Link
                                  href={`/products/${product.slug}`}
                                  target="_blank"
                                  style={{ fontSize: '0.72rem', color: '#38BDF8', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                                >
                                  /products/{product.slug} ↗
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Status */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontFamily: 'var(--font-mono, monospace)' }}>
                              {product.category}
                            </span>
                            <span
                              style={{
                                backgroundColor: product.status === 'LIVE' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                border: product.status === 'LIVE' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                                color: product.status === 'LIVE' ? '#38BDF8' : '#94A3B8',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono, monospace)',
                                display: 'inline-block',
                                width: 'fit-content',
                              }}
                            >
                              {product.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>

                        {/* Tech Stack */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', maxWidth: '200px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#38BDF8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono, monospace)' }}>
                            {product.technologies || '-'}
                          </div>
                        </td>

                        {/* Published Status Toggle */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(product)}
                            style={{
                              backgroundColor: product.published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                              border: product.published ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                              color: product.published ? '#34D399' : '#94A3B8',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-mono, monospace)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: product.published ? '#34D399' : '#94A3B8',
                              }}
                            />
                            {product.published ? 'LIVE / PUBLISHED' : 'DRAFT (HIDDEN)'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              style={{
                                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                                border: '1px solid rgba(22, 119, 255, 0.35)',
                                color: '#38BDF8',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id, product.name)}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#F87171',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono, monospace)',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Create & Edit Modal Form */
        <div
          style={{
            backgroundColor: 'rgba(6, 21, 43, 0.85)',
            border: '1px solid rgba(22, 119, 255, 0.25)',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '820px',
            margin: '0 auto',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
              {currentId ? `Edit Product: ${formData.name}` : 'Create New Product'}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Section 1: Overview */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                1. Product Identity &amp; Lifecycle
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cognitive Document Engine"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>URL Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cognitive-document-engine"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Software, SaaS Platform"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Release Stage</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="LIVE">Live in Production</option>
                    <option value="BETA">Private Beta</option>
                    <option value="IN_DEVELOPMENT">In Development</option>
                    <option value="PLANNED">Planned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Architecture & Links */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                2. Technical Architecture &amp; Links
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Technologies (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, Python, PostgreSQL, PyTorch"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Demo / Live URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://demo.quantumai.com"
                    value={formData.demoUrl}
                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Documentation URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://docs.quantumai.com"
                    value={formData.docsUrl}
                    onChange={(e) => setFormData({ ...formData, docsUrl: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Hero Cover Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '54px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {formData.heroImage ? (
                      <Image
                        src={formData.heroImage}
                        alt="Hero preview"
                        fill
                        sizes="80px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.25rem', color: '#64748B' }}>📦</span>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.35)',
                          color: '#38BDF8',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {isUploading ? 'Uploading...' : '📁 Upload Product Image'}
                      </button>
                      {formData.heroImage && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, heroImage: '' })}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#F87171',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste direct image URL (e.g. /images/products/portal.jpg)"
                      value={formData.heroImage}
                      onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                      style={{ ...inputStyle, fontSize: '0.78rem', padding: '0.45rem 0.65rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Description & Features */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                3. Technical Narrative &amp; Feature Capabilities
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Product Narrative &amp; Operational Purpose *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail what the product does, who it is engineered for, and the operational value it delivers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Core Feature Highlights</label>
                  <button
                    type="button"
                    onClick={addFeatureRow}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38BDF8',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    + Add Feature
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {formData.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Feature Title (e.g. RAG Search)"
                          value={feat.title}
                          onChange={(e) => updateFeatureRow(idx, 'title', e.target.value)}
                          style={{ ...inputStyle, padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Feature Description"
                          value={feat.description}
                          onChange={(e) => updateFeatureRow(idx, 'description', e.target.value)}
                          style={{ ...inputStyle, padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                        />
                      </div>
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeatureRow(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#F87171',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            padding: '0.35rem 0.5rem',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Publish Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="prodPublished"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <label htmlFor="prodPublished" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
                Publish immediately to the public Products directory (<span style={{ color: '#38BDF8' }}>/products</span> and <span style={{ color: '#38BDF8' }}>/products/[slug]</span>)
              </label>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.45rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                {isSubmitting ? 'Saving...' : currentId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
