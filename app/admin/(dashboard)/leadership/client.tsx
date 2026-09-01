'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import { createLeadershipMember, updateLeadershipMember, deleteLeadershipMember, reorderLeadershipMembers } from './actions';
import type { Leadership } from '@prisma/client';

const ROLE_PRESETS = [
  'Co-Founder & Chief Executive Officer',
  'Co-Founder & Executive Chairman',
  'Chief Technology Officer',
  'Lead Software Engineer',
  'Senior AI Systems Engineer',
  'VP of Engineering',
  'Director of Product',
  'Software Engineer',
  'AI Research Scientist',
  'Advisor',
];

const DEPARTMENT_PRESETS = [
  'Executive Leadership',
  'Artificial Intelligence',
  'Software Development',
  'Product & Design',
  'Operations & Strategy',
];

export default function LeadershipClient({ initialMembers = [] }: { initialMembers: Leadership[] }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [members, setMembers] = useState<Leadership[]>(initialMembers);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    publicId: '',
    position: 'Chief Technology Officer',
    department: 'Software Development',
    shortBio: '',
    fullBio: '',
    photo: '',
    email: '',
    linkedin: '',
    github: '',
    website: '',
    location: 'Peshawar, Pakistan',
    displayOrder: 0,
    isActive: true,
  });

  const handleCreate = () => {
    const count = members.length + 1;
    setFormData({
      name: '',
      slug: '',
      publicId: `QA-${String(count).padStart(3, '0')}`,
      position: 'Lead Software Engineer',
      department: 'Software Development',
      shortBio: '',
      fullBio: '',
      photo: '',
      email: '',
      linkedin: '',
      github: '',
      website: '',
      location: 'Pakistan',
      displayOrder: count,
      isActive: true,
    });
    setCurrentId(null);
    setIsEditing(true);
  };

  const handleEdit = (m: Leadership) => {
    setFormData({
      name: m.name || '',
      slug: m.slug || '',
      publicId: m.publicId || '',
      position: m.position || '',
      department: m.department || 'Software Development',
      shortBio: m.shortBio || '',
      fullBio: m.fullBio || '',
      photo: m.photo || '',
      email: m.email || '',
      linkedin: m.linkedin || '',
      github: (m as any).github || '',
      website: m.website || '',
      location: m.location || 'Pakistan',
      displayOrder: m.displayOrder || 0,
      isActive: m.isActive ?? true,
    });
    setCurrentId(m.id);
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
        setFormData((prev) => ({ ...prev, photo: result.url }));
        toast.success('Profile photo uploaded successfully!', 'Asset Ready');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload photo.', 'Upload Error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (member: Leadership) => {
    const newStatus = !member.isActive;
    try {
      await updateLeadershipMember(member.id, {
        isActive: newStatus,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, isActive: newStatus } : m))
      );
      toast.success(
        `"${member.name}" is now ${newStatus ? 'Active & Live on /leadership' : 'Inactive (Hidden)'}`,
        'Status Updated'
      );
      router.refresh();
    } catch (err) {
      toast.error('Failed to update status.', 'Error');
    }
  };

  const handleMoveOrder = async (memberId: string, direction: 'UP' | 'DOWN') => {
    if (isReordering) return; // Prevent rapid repeated clicks

    const currentIndex = members.findIndex((m) => m.id === memberId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    setIsReordering(true);

    // Optimistic UI: swap positions immediately
    const previousMembers = [...members];
    const newItems = [...members];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setMembers(reorderedItems);

    try {
      await reorderLeadershipMembers(reorderedItems.map((item) => item.id));
      toast.success(
        `"${movedItem.name}" moved ${direction === 'UP' ? 'up' : 'down'} to position ${targetIndex + 1}.`,
        'Order Updated'
      );
      router.refresh();
    } catch (err) {
      console.error('Reorder error:', err);
      // Rollback on failure
      setMembers(previousMembers);
      toast.error('Failed to save new order. Changes reverted.', 'Reorder Error');
    } finally {
      setIsReordering(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Leadership Profile',
      message: `Are you sure you want to permanently delete "${name}" from the Leadership & Team directory? This will also remove their public detail page.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteLeadershipMember(id);
        setMembers((prev) => prev.filter((m) => m.id !== id));
        toast.success(`"${name}" was deleted.`, 'Deleted');
        router.refresh();
      } catch (err) {
        toast.error('Failed to delete profile.', 'Error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Please enter full name', 'Validation');
      return;
    }
    if (!formData.position.trim()) {
      toast.warning('Please enter a role or position', 'Validation');
      return;
    }

    try {
      setIsSubmitting(true);
      if (currentId) {
        const updated = await updateLeadershipMember(currentId, formData);
        setMembers((prev) =>
          prev.map((m) => (m.id === currentId ? (updated as Leadership) : m))
        );
        toast.success(`Profile for "${formData.name}" updated!`, 'Saved');
      } else {
        const created = await createLeadershipMember(formData);
        setMembers((prev) => [...prev, created as Leadership]);
        toast.success(`Profile for "${formData.name}" created!`, 'Created');
      }
      setIsEditing(false);
      setCurrentId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = Array.from(new Set(members.map((m) => m.department).filter(Boolean))) as string[];

  const filteredMembers = members.filter((member) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      member.name.toLowerCase().includes(q) ||
      member.position.toLowerCase().includes(q) ||
      member.slug.toLowerCase().includes(q) ||
      (member.department && member.department.toLowerCase().includes(q)) ||
      (member.location && member.location.toLowerCase().includes(q)) ||
      member.shortBio.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && member.isActive) ||
      (statusFilter === 'INACTIVE' && !member.isActive);

    const matchesDepartment = departmentFilter === 'ALL' || member.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
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
                  placeholder="Search by name, role, department..."
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

              {departments.length > 0 && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
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
                  <option value="ALL">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
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
                href="/leadership"
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
                <span>View Public Team</span>
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
                <span>+</span> ADD MEMBER
              </button>
            </div>
          </div>

          {/* Members List Table */}
          {filteredMembers.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No team members found"
              description={
                searchQuery || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                  ? 'No members match your active search and filter criteria.'
                  : 'Add founders, executives, and engineers to feature them on the public /leadership page.'
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
                  + Add First Member
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
                        Member &amp; ID
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Position &amp; Department
                      </th>
                      <th style={{ padding: '0.85rem 1.15rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Social / Links
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
                    {filteredMembers.map((member, index) => (
                      <tr key={member.id} style={{ borderBottom: '1px solid rgba(22, 119, 255, 0.1)' }}>
                        {/* Order Controls */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', width: '80px' }}>
                          {(() => {
                            const memberIdx = members.findIndex((m) => m.id === member.id);
                            const isFirst = memberIdx <= 0;
                            const isLast = memberIdx === -1 || memberIdx >= members.length - 1;
                            const orderNumber = memberIdx !== -1 ? memberIdx + 1 : index + 1;
                            const upDisabled = isFirst || isReordering;
                            const downDisabled = isLast || isReordering;

                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: isReordering ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                                <button
                                  type="button"
                                  aria-label={`Move ${member.name} up`}
                                  title="Move up"
                                  disabled={upDisabled}
                                  onClick={() => handleMoveOrder(member.id, 'UP')}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: upDisabled ? 'rgba(148, 163, 184, 0.25)' : '#38BDF8',
                                    cursor: upDisabled ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95rem',
                                    padding: '0.15rem 0.25rem',
                                    borderRadius: '3px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1,
                                  }}
                                >
                                  ▲
                                </button>
                                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#94A3B8', minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>
                                  {orderNumber}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Move ${member.name} down`}
                                  title="Move down"
                                  disabled={downDisabled}
                                  onClick={() => handleMoveOrder(member.id, 'DOWN')}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: downDisabled ? 'rgba(148, 163, 184, 0.25)' : '#38BDF8',
                                    cursor: downDisabled ? 'not-allowed' : 'pointer',
                                    fontSize: '0.95rem',
                                    padding: '0.15rem 0.25rem',
                                    borderRadius: '3px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1,
                                  }}
                                >
                                  ▼
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Member & ID */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                                border: '1px solid rgba(22, 119, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: '#38BDF8',
                                flexShrink: 0,
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              {member.photo ? (
                                <Image
                                  src={member.photo}
                                  alt={member.name}
                                  fill
                                  sizes="40px"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                member.name.charAt(0).toUpperCase()
                              )}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.92rem' }}>
                                  {member.name}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontSize: '0.68rem',
                                    color: '#38BDF8',
                                    backgroundColor: 'rgba(22, 119, 255, 0.15)',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '3px',
                                  }}
                                >
                                  {member.publicId}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                                <Link
                                  href={`/leadership/${member.slug}`}
                                  target="_blank"
                                  style={{ fontSize: '0.72rem', color: '#38BDF8', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)' }}
                                >
                                  /leadership/{member.slug} ↗
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Position & Department */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 500, color: '#CBD5E1', fontSize: '0.85rem' }}>
                            {member.position}
                          </div>
                          {member.department && (
                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem', fontFamily: 'var(--font-mono, monospace)' }}>
                              {member.department}
                            </div>
                          )}
                        </td>

                        {/* Social / Links */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {member.linkedin && (
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                title="LinkedIn"
                                style={{ color: '#38BDF8', fontSize: '0.78rem', textDecoration: 'none', backgroundColor: 'rgba(22, 119, 255, 0.12)', padding: '0.2rem 0.45rem', borderRadius: 4 }}
                              >
                                in ↗
                              </a>
                            )}
                            {(member as any).github && (
                              <a
                                href={(member as any).github}
                                target="_blank"
                                rel="noreferrer"
                                title="GitHub"
                                aria-label={`View ${member.name}'s GitHub profile`}
                                style={{ color: '#F8FAFC', fontSize: '0.78rem', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.45rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                              </a>
                            )}
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                title={member.email}
                                style={{ color: '#94A3B8', fontSize: '0.78rem', textDecoration: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.45rem', borderRadius: 4 }}
                              >
                                ✉
                              </a>
                            )}
                            {!member.linkedin && !(member as any).github && !member.email && (
                              <span style={{ color: '#64748B', fontSize: '0.75rem' }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Active Status Toggle */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(member)}
                            style={{
                              backgroundColor: member.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                              border: member.isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                              color: member.isActive ? '#34D399' : '#94A3B8',
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
                                backgroundColor: member.isActive ? '#34D399' : '#94A3B8',
                              }}
                            />
                            {member.isActive ? 'ACTIVE / LIVE' : 'INACTIVE (HIDDEN)'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1.15rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(member)}
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
                              onClick={() => handleDelete(member.id, member.name)}
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
              {currentId ? `Edit Profile: ${formData.name}` : 'Add Leadership & Team Member'}
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
            {/* Section 1: Identity */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                1. Member Identity &amp; Title
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fawadullah Imraj"
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
                    placeholder="e.g. fawadullah-imraj"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Role / Position *</label>
                  <input
                    type="text"
                    required
                    list="rolePresets"
                    placeholder="e.g. Co-Founder & Chief Executive Officer"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    style={inputStyle}
                  />
                  <datalist id="rolePresets">
                    {ROLE_PRESETS.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={labelStyle}>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={inputStyle}
                  >
                    {DEPARTMENT_PRESETS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Avatar & Media */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                2. Profile Photo &amp; Location
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
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
                    {formData.photo ? (
                      <Image
                        src={formData.photo}
                        alt="Avatar preview"
                        fill
                        sizes="54px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.2rem', color: '#64748B' }}>👤</span>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {isUploading ? 'Uploading...' : '📁 Upload Photo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Location / Base</label>
                  <input
                    type="text"
                    placeholder="e.g. Peshawar, Pakistan"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Biography */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                3. Biography &amp; Technical Focus
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={labelStyle}>Short Bio / Tagline *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="1-2 sentences summarizing focus and role..."
                  value={formData.shortBio}
                  onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Full Biography (for Profile Detail Page)</label>
                <textarea
                  rows={4}
                  placeholder="Comprehensive background, achievements, and systems engineered..."
                  value={formData.fullBio}
                  onChange={(e) => setFormData({ ...formData, fullBio: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
            </div>

            {/* Section 4: Social Links & Contact */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: 'var(--font-mono, monospace)' }}>
                4. Social Links &amp; Contact
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>LinkedIn URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>GitHub Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. contact@quantumai.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Personal Website / Portfolio</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Active Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="memberActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="memberActive" style={{ fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
                Active &amp; published on public directory (<span style={{ color: '#38BDF8' }}>/leadership</span> and <span style={{ color: '#38BDF8' }}>/leadership/[slug]</span>)
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
                {isSubmitting ? 'Saving...' : currentId ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
