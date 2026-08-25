'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { SiteSettingsMap, DEFAULT_SETTINGS } from '@/lib/settings';
import { updateSiteSettings, resetSiteSettingsToDefaults } from './actions';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';
import MediaLibrary, { MediaItem } from '@/components/admin/MediaLibrary';

type TabKey = 'general' | 'branding' | 'contact' | 'social' | 'seo' | 'homepage' | 'navigation';

interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
  desc: string;
}

const TABS: TabItem[] = [
  { key: 'general', label: 'Company Info', icon: '🏢', desc: 'Core company profile and identity' },
  { key: 'branding', label: 'Branding & Assets', icon: '🎨', desc: 'Logos, favicons, and social share graphics' },
  { key: 'contact', label: 'Contact Details', icon: '📞', desc: 'Public emails, notification routing, and location' },
  { key: 'social', label: 'Social Channels', icon: '🌐', desc: 'Official company social media profiles' },
  { key: 'seo', label: 'SEO & Metadata', icon: '🔍', desc: 'Search engine metadata and indexing rules' },
  { key: 'homepage', label: 'Hero & Homepage', icon: '🏠', desc: 'Hero headlines, descriptions, and CTA links' },
  { key: 'navigation', label: 'Navigation & Footer', icon: '🧭', desc: 'Global header CTA and footer copyright' },
];

export default function SettingsClient({ initialSettings }: { initialSettings: SiteSettingsMap }) {
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  const [savedData, setSavedData] = useState<SiteSettingsMap>(initialSettings);
  const [formData, setFormData] = useState<SiteSettingsMap>(initialSettings);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [saving, setSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Media Library modal state for asset selection
  const [mediaModalField, setMediaModalField] = useState<keyof SiteSettingsMap | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadFieldRef = useRef<keyof SiteSettingsMap | null>(null);

  // Check if there are unsaved changes
  const isDirty = JSON.stringify(savedData) !== JSON.stringify(formData);

  const handleChange = (key: keyof SiteSettingsMap, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Company Name
    if (!formData.company_name?.trim() && !formData.QUANTUM_AI?.trim()) {
      newErrors.company_name = 'Company Name cannot be blank.';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.company_email && !emailRegex.test(formData.company_email.trim())) {
      newErrors.company_email = 'Please provide a valid official email address.';
    }
    if (formData.company_routing_email && !emailRegex.test(formData.company_routing_email.trim())) {
      newErrors.company_routing_email = 'Please provide a valid notification routing email address.';
    }

    // URL validation helper (allows relative /paths or absolute https://)
    const isValidUrl = (url: string) => {
      if (!url || !url.trim()) return true;
      const trimmed = url.trim();
      return trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
    };

    if (formData.company_linkedin && !isValidUrl(formData.company_linkedin)) {
      newErrors.company_linkedin = 'LinkedIn URL must start with https:// or http://';
    }
    if (formData.company_twitter && !isValidUrl(formData.company_twitter)) {
      newErrors.company_twitter = 'Twitter URL must start with https:// or http://';
    }
    if (formData.company_github && !isValidUrl(formData.company_github)) {
      newErrors.company_github = 'GitHub URL must start with https:// or http://';
    }
    if (formData.company_instagram && !isValidUrl(formData.company_instagram)) {
      newErrors.company_instagram = 'Instagram URL must start with https:// or http://';
    }
    if (formData.company_youtube && !isValidUrl(formData.company_youtube)) {
      newErrors.company_youtube = 'YouTube URL must start with https:// or http://';
    }
    if (formData.company_facebook && !isValidUrl(formData.company_facebook)) {
      newErrors.company_facebook = 'Facebook URL must start with https:// or http://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      toast.error('Please fix validation errors before saving settings.', 'Validation Error');
      return;
    }

    setSaving(true);
    try {
      const payload = Object.entries(formData).map(([key, value]) => ({
        key,
        value: String(value ?? ''),
      }));

      await updateSiteSettings(payload);
      setSavedData(formData);
      toast.success('Website settings updated and synchronized across all pages.', 'Settings Saved');
    } catch (err: any) {
      console.error('Settings save error:', err);
      toast.error(err?.message || 'Failed to save site settings.', 'Save Error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (isDirty) {
      const confirmed = await confirm({
        title: 'Discard Unsaved Changes',
        message: 'Are you sure you want to discard all unsaved changes? Form values will return to the current active settings.',
        confirmText: 'Discard Changes',
        confirmVariant: 'warning',
      });
      if (!confirmed) return;
    }
    setFormData(savedData);
    setErrors({});
    toast.info('Reverted all fields to saved settings.', 'Changes Discarded');
  };

  const handleRestoreDefaults = async () => {
    const confirmed = await confirm({
      title: 'Restore Default Settings',
      message: 'Are you sure you want to reset all site settings to system factory defaults? This will restore original branding, contact, and SEO defaults.',
      confirmText: 'Restore Defaults',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    setIsResetting(true);
    try {
      await resetSiteSettingsToDefaults();
      setFormData(DEFAULT_SETTINGS);
      setSavedData(DEFAULT_SETTINGS);
      setErrors({});
      toast.success('Site settings restored to system defaults.', 'Settings Restored');
    } catch (err: any) {
      console.error('Reset error:', err);
      toast.error(err?.message || 'Failed to restore default settings.', 'Reset Error');
    } finally {
      setIsResetting(false);
    }
  };

  // Direct file upload for branding assets
  const triggerFileUpload = (field: keyof SiteSettingsMap) => {
    targetUploadFieldRef.current = field;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = targetUploadFieldRef.current;
    if (!file || !field) return;

    setUploadingField(field);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }
      const mediaItem = await res.json();
      if (mediaItem.url) {
        handleChange(field, mediaItem.url);
        toast.success(`Asset "${mediaItem.filename}" uploaded & selected.`, 'Asset Uploaded');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload image.', 'Upload Error');
    } finally {
      setUploadingField(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectMedia = (item: MediaItem) => {
    if (mediaModalField) {
      handleChange(mediaModalField, item.url);
      toast.success(`Selected "${item.filename}" for ${mediaModalField}.`, 'Asset Selected');
      setMediaModalField(null);
    }
  };

  // Styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    backgroundColor: '#070B14',
    border: '1px solid rgba(22, 119, 255, 0.25)',
    borderRadius: 8,
    color: '#F8FAFC',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-mono, monospace)',
    textTransform: 'uppercase',
  };

  const errorTextStyle: React.CSSProperties = {
    color: '#F87171',
    fontSize: '0.75rem',
    marginTop: '0.3rem',
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Hidden File Input for Direct Asset Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon"
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.12)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              color: '#1677FF',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
              fontWeight: 600,
            }}
          >
            SYSTEM CONFIGURATION
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
            Website Settings
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem', maxWidth: 600, lineHeight: 1.5 }}>
            Configure global branding, official company information, contact routing, social links, SEO metadata, and hero content.
          </p>
        </div>

        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isDirty ? (
            <span
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                color: '#FACC15',
                padding: '0.35rem 0.75rem',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>●</span> Unsaved Changes
            </span>
          ) : (
            <span
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#6EE7B7',
                padding: '0.35rem 0.75rem',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>✓</span> Live &amp; Synced
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.1)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 0.95rem',
                backgroundColor: isActive ? '#1677FF' : 'rgba(6, 21, 43, 0.65)',
                border: isActive ? '1px solid #1677FF' : '1px solid rgba(22, 119, 255, 0.15)',
                borderRadius: 8,
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave}>
        {/* ─── TAB 1: GENERAL & COMPANY INFO ─── */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🏢</span>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Company Profile</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Main organizational identity across the website</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>
                    Company Name <span style={{ color: '#38BDF8' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => {
                      handleChange('company_name', e.target.value);
                      handleChange('QUANTUM_AI', e.target.value);
                    }}
                    placeholder="e.g. Quantum AI"
                    style={{
                      ...inputStyle,
                      borderColor: errors.company_name ? '#EF4444' : undefined,
                    }}
                  />
                  {errors.company_name && <p style={errorTextStyle}>{errors.company_name}</p>}
                </div>

                <div>
                  <label style={labelStyle}>Legal / Registered Entity Name</label>
                  <input
                    type="text"
                    value={formData.company_legal_name}
                    onChange={(e) => handleChange('company_legal_name', e.target.value)}
                    placeholder="e.g. Quantum AI Engineering Labs"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Founded Year</label>
                  <input
                    type="text"
                    value={formData.company_founded_year}
                    onChange={(e) => handleChange('company_founded_year', e.target.value)}
                    placeholder="e.g. 2023"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tagline / Short Slogan</label>
                  <input
                    type="text"
                    value={formData.company_tagline}
                    onChange={(e) => handleChange('company_tagline', e.target.value)}
                    placeholder="e.g. One intelligence core. Many systems. Real products."
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <label style={labelStyle}>Company Overview / Long Description</label>
                <textarea
                  rows={3}
                  value={formData.company_description}
                  onChange={(e) => handleChange('company_description', e.target.value)}
                  placeholder="Describe your company and core capabilities..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: BRANDING & ASSETS ─── */}
        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🎨</span>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Branding Assets &amp; Media</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Control brand logos, site icons, and social share graphics</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Logo Control */}
                <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 10, padding: '1rem' }}>
                  <label style={labelStyle}>Main Brand Logo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#030712',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {formData.site_logo ? (
                        <Image src={formData.site_logo} alt="Logo" fill sizes="64px" style={{ objectFit: 'contain', padding: 4 }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>💎</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={formData.site_logo}
                        onChange={(e) => handleChange('site_logo', e.target.value)}
                        placeholder="/quantum-q-logo.png"
                        style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => triggerFileUpload('site_logo')}
                      disabled={uploadingField === 'site_logo'}
                      style={{
                        flex: 1,
                        backgroundColor: '#1677FF',
                        border: 'none',
                        color: '#fff',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {uploadingField === 'site_logo' ? 'Uploading...' : 'Upload Logo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaModalField('site_logo')}
                      style={{
                        backgroundColor: 'rgba(22, 119, 255, 0.15)',
                        border: '1px solid rgba(22, 119, 255, 0.3)',
                        color: '#38BDF8',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      Media Library
                    </button>
                    {formData.site_logo && (
                      <button
                        type="button"
                        onClick={() => handleChange('site_logo', '')}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          padding: '0.4rem 0.65rem',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Favicon Control */}
                <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 10, padding: '1rem' }}>
                  <label style={labelStyle}>Browser Favicon</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#030712',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {formData.site_favicon ? (
                        <Image src={formData.site_favicon} alt="Favicon" fill sizes="64px" style={{ objectFit: 'contain', padding: 8 }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>🌐</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={formData.site_favicon}
                        onChange={(e) => handleChange('site_favicon', e.target.value)}
                        placeholder="/favicon.ico"
                        style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => triggerFileUpload('site_favicon')}
                      disabled={uploadingField === 'site_favicon'}
                      style={{
                        flex: 1,
                        backgroundColor: '#1677FF',
                        border: 'none',
                        color: '#fff',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {uploadingField === 'site_favicon' ? 'Uploading...' : 'Upload Favicon'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaModalField('site_favicon')}
                      style={{
                        backgroundColor: 'rgba(22, 119, 255, 0.15)',
                        border: '1px solid rgba(22, 119, 255, 0.3)',
                        color: '#38BDF8',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      Media Library
                    </button>
                    {formData.site_favicon && (
                      <button
                        type="button"
                        onClick={() => handleChange('site_favicon', '')}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          padding: '0.4rem 0.65rem',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Social Share OG Image */}
                <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 10, padding: '1rem' }}>
                  <label style={labelStyle}>Default Social Share (OG Image)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.75rem 0' }}>
                    <div
                      style={{
                        width: '96px',
                        height: '54px',
                        backgroundColor: '#030712',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {formData.site_og_image ? (
                        <Image src={formData.site_og_image} alt="OG Image" fill sizes="96px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={formData.site_og_image}
                        onChange={(e) => handleChange('site_og_image', e.target.value)}
                        placeholder="/quantum-q-logo.png"
                        style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => triggerFileUpload('site_og_image')}
                      disabled={uploadingField === 'site_og_image'}
                      style={{
                        flex: 1,
                        backgroundColor: '#1677FF',
                        border: 'none',
                        color: '#fff',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {uploadingField === 'site_og_image' ? 'Uploading...' : 'Upload OG Image'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaModalField('site_og_image')}
                      style={{
                        backgroundColor: 'rgba(22, 119, 255, 0.15)',
                        border: '1px solid rgba(22, 119, 255, 0.3)',
                        color: '#38BDF8',
                        padding: '0.4rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      Media Library
                    </button>
                    {formData.site_og_image && (
                      <button
                        type="button"
                        onClick={() => handleChange('site_og_image', '')}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          padding: '0.4rem 0.65rem',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Brand Accent Color */}
                <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 10, padding: '1rem' }}>
                  <label style={labelStyle}>Brand Accent Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <input
                      type="color"
                      value={formData.brand_accent_color || '#1677FF'}
                      onChange={(e) => handleChange('brand_accent_color', e.target.value)}
                      style={{
                        width: '48px',
                        height: '42px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(22, 119, 255, 0.3)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        padding: 2,
                      }}
                    />
                    <input
                      type="text"
                      value={formData.brand_accent_color}
                      onChange={(e) => handleChange('brand_accent_color', e.target.value)}
                      placeholder="#1677FF"
                      style={inputStyle}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.5rem 0 0 0' }}>
                    Used for glowing accents, primary buttons, and visual highlights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: CONTACT INFORMATION ─── */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📞</span>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Contact &amp; Notification Routing</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Manage public contact channels and admin notification dispatch emails</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Official Public Contact Email</label>
                  <input
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    placeholder="hello@quantumai.dev"
                    style={{ ...inputStyle, borderColor: errors.company_email ? '#EF4444' : undefined }}
                  />
                  {errors.company_email && <p style={errorTextStyle}>{errors.company_email}</p>}
                  <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0.3rem 0 0 0' }}>Displayed on the Contact page, Header, and Footer.</p>
                </div>

                <div>
                  <label style={labelStyle}>Inquiry Routing / Notification Email</label>
                  <input
                    type="email"
                    value={formData.company_routing_email}
                    onChange={(e) => handleChange('company_routing_email', e.target.value)}
                    placeholder="fawadimraj@gmail.com"
                    style={{ ...inputStyle, borderColor: errors.company_routing_email ? '#EF4444' : undefined }}
                  />
                  {errors.company_routing_email && <p style={errorTextStyle}>{errors.company_routing_email}</p>}
                  <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '0.3rem 0 0 0' }}>Receives automated notifications when new project inquiries are submitted.</p>
                </div>

                <div>
                  <label style={labelStyle}>Office Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.company_phone}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Office Location / Headquarters</label>
                  <input
                    type="text"
                    value={formData.company_location}
                    onChange={(e) => handleChange('company_location', e.target.value)}
                    placeholder="San Francisco & Islamabad"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <label style={labelStyle}>Response Time SLA Statement</label>
                <textarea
                  rows={2}
                  value={formData.response_time_text}
                  onChange={(e) => handleChange('response_time_text', e.target.value)}
                  placeholder="We review all technical inquiries within 24 hours..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: SOCIAL CHANNELS ─── */}
        {activeTab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Social Media &amp; Repositories</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Connect official corporate channels with live URL test actions</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* LinkedIn */}
                <div>
                  <label style={labelStyle}>LinkedIn Profile / Company URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      value={formData.company_linkedin}
                      onChange={(e) => handleChange('company_linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/quantumai"
                      style={{ ...inputStyle, borderColor: errors.company_linkedin ? '#EF4444' : undefined }}
                    />
                    {formData.company_linkedin && (
                      <a
                        href={formData.company_linkedin}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.3)',
                          color: '#38BDF8',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Test link in new tab"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                  {errors.company_linkedin && <p style={errorTextStyle}>{errors.company_linkedin}</p>}
                </div>

                {/* Twitter / X */}
                <div>
                  <label style={labelStyle}>Twitter / X URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      value={formData.company_twitter}
                      onChange={(e) => handleChange('company_twitter', e.target.value)}
                      placeholder="https://x.com/quantumai"
                      style={{ ...inputStyle, borderColor: errors.company_twitter ? '#EF4444' : undefined }}
                    />
                    {formData.company_twitter && (
                      <a
                        href={formData.company_twitter}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.3)',
                          color: '#38BDF8',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Test link in new tab"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                  {errors.company_twitter && <p style={errorTextStyle}>{errors.company_twitter}</p>}
                </div>

                {/* GitHub */}
                <div>
                  <label style={labelStyle}>GitHub Organization / Repo URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      value={formData.company_github}
                      onChange={(e) => handleChange('company_github', e.target.value)}
                      placeholder="https://github.com/Fawadullah15/Quantum_AI"
                      style={{ ...inputStyle, borderColor: errors.company_github ? '#EF4444' : undefined }}
                    />
                    {formData.company_github && (
                      <a
                        href={formData.company_github}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.3)',
                          color: '#38BDF8',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Test link in new tab"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                  {errors.company_github && <p style={errorTextStyle}>{errors.company_github}</p>}
                </div>

                {/* Instagram */}
                <div>
                  <label style={labelStyle}>Instagram Profile URL (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      value={formData.company_instagram}
                      onChange={(e) => handleChange('company_instagram', e.target.value)}
                      placeholder="https://instagram.com/quantumai"
                      style={{ ...inputStyle, borderColor: errors.company_instagram ? '#EF4444' : undefined }}
                    />
                    {formData.company_instagram && (
                      <a
                        href={formData.company_instagram}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.3)',
                          color: '#38BDF8',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Test link in new tab"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                  {errors.company_instagram && <p style={errorTextStyle}>{errors.company_instagram}</p>}
                </div>

                {/* YouTube */}
                <div>
                  <label style={labelStyle}>YouTube Channel URL (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      value={formData.company_youtube}
                      onChange={(e) => handleChange('company_youtube', e.target.value)}
                      placeholder="https://youtube.com/@quantumai"
                      style={{ ...inputStyle, borderColor: errors.company_youtube ? '#EF4444' : undefined }}
                    />
                    {formData.company_youtube && (
                      <a
                        href={formData.company_youtube}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.3)',
                          color: '#38BDF8',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Test link in new tab"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                  {errors.company_youtube && <p style={errorTextStyle}>{errors.company_youtube}</p>}
                </div>

                {/* Facebook */}
                <div>
                  <label style={labelStyle}>Facebook Page URL (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      value={formData.company_facebook}
                      onChange={(e) => handleChange('company_facebook', e.target.value)}
                      placeholder="https://facebook.com/quantumai"
                      style={{ ...inputStyle, borderColor: errors.company_facebook ? '#EF4444' : undefined }}
                    />
                    {formData.company_facebook && (
                      <a
                        href={formData.company_facebook}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: 'rgba(22, 119, 255, 0.15)',
                          border: '1px solid rgba(22, 119, 255, 0.3)',
                          color: '#38BDF8',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Test link in new tab"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                  {errors.company_facebook && <p style={errorTextStyle}>{errors.company_facebook}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: SEO & METADATA ─── */}
        {activeTab === 'seo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔍</span>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Search Engine Optimization (SEO)</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Global meta titles, descriptions, indexing directives, and keywords</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>Default Meta Title</label>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                      {formData.meta_title?.length || 0} / 60 characters recommended
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => handleChange('meta_title', e.target.value)}
                    placeholder="Quantum AI | AI, Software & Automation Solutions"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>Default Meta Description</label>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                      {formData.meta_description?.length || 0} / 160 characters recommended
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.meta_description}
                    onChange={(e) => handleChange('meta_description', e.target.value)}
                    placeholder="Brief summary of your company for search engine result snippets..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Meta Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(e) => handleChange('meta_keywords', e.target.value)}
                    placeholder="Artificial Intelligence, Machine Learning, AI Agents, Custom Business Software"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.18)', borderRadius: 8, padding: '0.85rem 1.15rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.88rem' }}>Search Engine Indexing (Robots)</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Allow Google and other search engines to index and rank this site</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.robots_index !== 'false'}
                      onChange={(e) => handleChange('robots_index', e.target.checked ? 'true' : 'false')}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: formData.robots_index !== 'false' ? '#1677FF' : '#334155',
                        borderRadius: 999,
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: formData.robots_index !== 'false' ? 22 : 2,
                          width: 20,
                          height: 20,
                          backgroundColor: '#FFFFFF',
                          borderRadius: '50%',
                          transition: 'left 0.2s',
                        }}
                      />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: HOMEPAGE & HERO ─── */}
        {activeTab === 'homepage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🏠</span>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Hero &amp; Homepage Headlines</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Configure main hero text, subtitles, and call-to-action buttons</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Hero System Eyebrow Tag</label>
                  <input
                    type="text"
                    value={formData.hero_eyebrow}
                    onChange={(e) => handleChange('hero_eyebrow', e.target.value)}
                    placeholder="SYS.CORE // INTELLIGENCE ARCHITECTURE"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Hero Headline</label>
                  <input
                    type="text"
                    value={formData.hero_headline}
                    onChange={(e) => handleChange('hero_headline', e.target.value)}
                    placeholder="WE BUILD\nINTELLIGENT\nSOFTWARE"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <label style={labelStyle}>Hero Description Copy</label>
                <textarea
                  rows={3}
                  value={formData.hero_description}
                  onChange={(e) => handleChange('hero_description', e.target.value)}
                  placeholder="Quantum AI builds AI systems, custom business software, and automation..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.25rem', borderTop: '1px solid #1E293B', paddingTop: '1.25rem' }}>
                {/* Primary CTA */}
                <div>
                  <div style={{ fontWeight: 600, color: '#38BDF8', fontSize: '0.82rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono, monospace)' }}>
                    PRIMARY CALL TO ACTION
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Button Label</label>
                      <input
                        type="text"
                        value={formData.hero_cta_primary_label}
                        onChange={(e) => handleChange('hero_cta_primary_label', e.target.value)}
                        placeholder="START A PROJECT"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Button Destination URL</label>
                      <input
                        type="text"
                        value={formData.hero_cta_primary_link}
                        onChange={(e) => handleChange('hero_cta_primary_link', e.target.value)}
                        placeholder="/contact"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary CTA */}
                <div>
                  <div style={{ fontWeight: 600, color: '#94A3B8', fontSize: '0.82rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono, monospace)' }}>
                    SECONDARY CALL TO ACTION
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Button Label</label>
                      <input
                        type="text"
                        value={formData.hero_cta_secondary_label}
                        onChange={(e) => handleChange('hero_cta_secondary_label', e.target.value)}
                        placeholder="EXPLORE OUR WORK"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Button Destination URL</label>
                      <input
                        type="text"
                        value={formData.hero_cta_secondary_link}
                        onChange={(e) => handleChange('hero_cta_secondary_link', e.target.value)}
                        placeholder="/work"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 7: NAVIGATION & FOOTER ─── */}
        {activeTab === 'navigation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#0B111E', border: '1px solid #1E293B', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🧭</span>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>Header Navigation &amp; Global Footer</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>Configure global header CTA buttons, footer copyright, and notices</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Header Main CTA Button Label</label>
                  <input
                    type="text"
                    value={formData.nav_cta_label}
                    onChange={(e) => handleChange('nav_cta_label', e.target.value)}
                    placeholder="Start a Project"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Header CTA Destination URL</label>
                  <input
                    type="text"
                    value={formData.nav_cta_link}
                    onChange={(e) => handleChange('nav_cta_link', e.target.value)}
                    placeholder="/contact"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Footer Tagline Copy</label>
                  <input
                    type="text"
                    value={formData.footer_tagline}
                    onChange={(e) => handleChange('footer_tagline', e.target.value)}
                    placeholder="Intelligent software for a connected world."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Footer Copyright Text</label>
                  <input
                    type="text"
                    value={formData.footer_copyright}
                    onChange={(e) => handleChange('footer_copyright', e.target.value)}
                    placeholder="© 2026 Quantum AI. All rights reserved."
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Sticky Bottom Action Bar ─── */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(7, 11, 20, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(22, 119, 255, 0.25)',
            padding: '0.85rem 1.5rem',
            zIndex: 90,
            boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                disabled={isResetting || saving}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  padding: '0.55rem 1rem',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: isResetting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {isResetting ? 'Restoring...' : '↺ Restore Defaults'}
              </button>

              {isDirty && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#CBD5E1',
                    padding: '0.55rem 1rem',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Discard Changes
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving || !isDirty}
                style={{
                  backgroundColor: isDirty ? '#1677FF' : '#1E293B',
                  border: 'none',
                  borderRadius: 8,
                  color: isDirty ? '#FFFFFF' : '#64748B',
                  padding: '0.6rem 1.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
                  boxShadow: isDirty ? '0 4px 16px rgba(22, 119, 255, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                {saving ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ─── Media Library Modal for Selecting Branding Assets ─── */}
      {mediaModalField && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setMediaModalField(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#06152B',
              border: '1px solid rgba(22, 119, 255, 0.3)',
              borderRadius: 14,
              padding: '1.75rem',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(22, 119, 255, 0.15)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
                  Select Asset for {mediaModalField}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  Click an image from your Media Library to assign it to this branding field
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMediaModalField(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                ✕
              </button>
            </div>

            <MediaLibrary selectable onSelect={handleSelectMedia} />
          </div>
        </div>
      )}
    </div>
  );
}
