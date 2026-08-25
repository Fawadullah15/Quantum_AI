'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/components/admin/AdminToast';
import { useAdminConfirm } from '@/components/admin/ConfirmDialog';

interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export default function AccountSettingsClient({ user }: { user: AccountUser }) {
  const router = useRouter();
  const toast = useAdminToast();
  const { confirm } = useAdminConfirm();

  // Profile update state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Session revocation state
  const [sessionPassword, setSessionPassword] = useState('');
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showSessionPassword, setShowSessionPassword] = useState(false);

  // Inline Validation Errors
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [sessionErrors, setSessionErrors] = useState<Record<string, string>>({});

  // ─────────────────────────────────────────────────────────────
  // 1. UPDATE PROFILE (USERNAME / EMAIL)
  // ─────────────────────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Username / Name cannot be blank.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!profilePassword) {
      errors.profilePassword = 'Enter your current password to authorize profile changes.';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setProfileLoading(true);

    try {
      const res = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PROFILE',
          currentPassword: profilePassword,
          newName: name.trim(),
          newEmail: email.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Account profile & username updated successfully.', 'Profile Updated');
        setProfilePassword('');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to update profile.', 'Error');
        if (data.error?.toLowerCase().includes('password')) {
          setProfileErrors({ profilePassword: data.error });
        }
      }
    } catch {
      toast.error('Network error while updating profile. Please try again.', 'Network Error');
    } finally {
      setProfileLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. CHANGE PASSWORD
  // ─────────────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = 'Enter your current password.';
    }
    if (!newPassword || newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters long.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'New password cannot be the same as your current password.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setPasswordLoading(true);

    try {
      const res = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHANGE_PASSWORD',
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Password updated successfully. Keep your credentials secure.', 'Password Changed');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to change password.', 'Password Error');
        if (data.error?.toLowerCase().includes('current')) {
          setPasswordErrors({ currentPassword: data.error });
        } else if (data.error) {
          setPasswordErrors({ newPassword: data.error });
        }
      }
    } catch {
      toast.error('Network error while updating password.', 'Network Error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. LOG OUT OTHER DEVICES
  // ─────────────────────────────────────────────────────────────
  const handleLogoutOtherDevices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionPassword) {
      setSessionErrors({ sessionPassword: 'Enter your password to authorize session invalidation.' });
      return;
    }

    setSessionErrors({});
    setSessionLoading(true);

    try {
      const res = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGOUT_OTHER_DEVICES',
          currentPassword: sessionPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          'All other active device sessions have been invalidated. This device remains authenticated.',
          'Sessions Revoked'
        );
        setSessionPassword('');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to revoke other sessions.', 'Revocation Failed');
        if (data.error?.toLowerCase().includes('password')) {
          setSessionErrors({ sessionPassword: data.error });
        }
      }
    } catch {
      toast.error('Network error during session revocation.', 'Network Error');
    } finally {
      setSessionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. LOG OUT ALL DEVICES
  // ─────────────────────────────────────────────────────────────
  const handleLogoutAllDevices = async () => {
    const confirmed = await confirm({
      title: 'Global Sign Out',
      message: 'Are you sure you want to invalidate all active sessions and log out of ALL devices (including this browser)? You will be returned to the login screen.',
      confirmText: 'Sign Out Everywhere',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    try {
      await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGOUT_ALL_DEVICES' }),
      });
      toast.info('All sessions invalidated. Logging out...', 'Global Sign Out');
      await signOut({ callbackUrl: '/admin/login' });
    } catch {
      await signOut({ callbackUrl: '/admin/login' });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5. LOG OUT CURRENT SESSION
  // ─────────────────────────────────────────────────────────────
  const handleCurrentLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of this admin session?',
      confirmText: 'Sign Out',
      confirmVariant: 'warning',
    });

    if (confirmed) {
      await signOut({ callbackUrl: '/admin/login' });
    }
  };

  // Styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#0B111E',
    border: '1px solid #1E293B',
    borderRadius: 12,
    padding: 'clamp(1.25rem, 3vw, 1.75rem)',
  };

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
    transition: 'border-color 0.2s',
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
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '4rem', color: '#F8FAFC' }}>
      {/* ─── Page Header ─── */}
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
            SECURITY &amp; ACCESS
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Account Security
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem', maxWidth: 600, lineHeight: 1.5 }}>
            Manage administrator credentials, password encryption, role authorization, and multi-device session revocation.
          </p>
        </div>

        {/* Quick Sign Out Action */}
        <button
          type="button"
          onClick={handleCurrentLogout}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5',
            padding: '0.55rem 1.15rem',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>

      {/* ─── Account Summary Bar ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
            Admin Account
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', marginTop: '0.25rem' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email}
          </div>
        </div>

        <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
            Account Role
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span
              style={{
                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                border: '1px solid rgba(22, 119, 255, 0.4)',
                color: '#38BDF8',
                padding: '0.2rem 0.6rem',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {user.role || 'SUPER_ADMIN'}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
            Full system administrative permissions
          </div>
        </div>

        <div style={{ backgroundColor: '#070B14', border: '1px solid rgba(22, 119, 255, 0.2)', borderRadius: 10, padding: '1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase' }}>
            Security Level
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
            <span style={{ color: '#10B981', fontSize: '0.8rem' }}>🔒</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#34D399' }}>Bcrypt Hashed</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.25rem' }}>
            Token Version: v{user.tokenVersion}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* ─── 1. Profile / Username Section ─── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>👤</span>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>
                Admin Profile &amp; Username
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                Update your visible display name, username, and login email address
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>
                  Admin Name / Username <span style={{ color: '#38BDF8' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (profileErrors.name) setProfileErrors((p) => ({ ...p, name: '' }));
                  }}
                  style={{ ...inputStyle, borderColor: profileErrors.name ? '#EF4444' : undefined }}
                  placeholder="e.g. Admin"
                />
                {profileErrors.name && <p style={errorTextStyle}>{profileErrors.name}</p>}
              </div>

              <div>
                <label style={labelStyle}>
                  Admin Login Email <span style={{ color: '#38BDF8' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (profileErrors.email) setProfileErrors((p) => ({ ...p, email: '' }));
                  }}
                  style={{ ...inputStyle, borderColor: profileErrors.email ? '#EF4444' : undefined }}
                  placeholder="admin@company.com"
                />
                {profileErrors.email && <p style={errorTextStyle}>{profileErrors.email}</p>}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Current Password (Required for security verification) <span style={{ color: '#38BDF8' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showProfilePassword ? 'text' : 'password'}
                  required
                  value={profilePassword}
                  onChange={(e) => {
                    setProfilePassword(e.target.value);
                    if (profileErrors.profilePassword) setProfileErrors((p) => ({ ...p, profilePassword: '' }));
                  }}
                  style={{
                    ...inputStyle,
                    paddingRight: '2.5rem',
                    borderColor: profileErrors.profilePassword ? '#EF4444' : undefined,
                  }}
                  placeholder="Enter current password to authorize changes"
                />
                <button
                  type="button"
                  onClick={() => setShowProfilePassword(!showProfilePassword)}
                  aria-label={showProfilePassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.25rem',
                  }}
                >
                  {showProfilePassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {profileErrors.profilePassword && <p style={errorTextStyle}>{profileErrors.profilePassword}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={profileLoading}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.6rem 1.45rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: profileLoading ? 'not-allowed' : 'pointer',
                  opacity: profileLoading ? 0.7 : 1,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.04em',
                }}
              >
                {profileLoading ? 'Verifying & Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* ─── 2. Password Change Section ─── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🔑</span>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9', margin: 0 }}>
                Change Account Password
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                Secure your account with strong Bcrypt-encrypted password hashing
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>
                Current Password <span style={{ color: '#38BDF8' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) setPasswordErrors((p) => ({ ...p, currentPassword: '' }));
                  }}
                  style={{
                    ...inputStyle,
                    paddingRight: '2.5rem',
                    borderColor: passwordErrors.currentPassword ? '#EF4444' : undefined,
                  }}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.25rem',
                  }}
                >
                  {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {passwordErrors.currentPassword && <p style={errorTextStyle}>{passwordErrors.currentPassword}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>
                  New Password (min 8 characters) <span style={{ color: '#38BDF8' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.newPassword) setPasswordErrors((p) => ({ ...p, newPassword: '' }));
                    }}
                    style={{
                      ...inputStyle,
                      paddingRight: '2.5rem',
                      borderColor: passwordErrors.newPassword ? '#EF4444' : undefined,
                    }}
                    placeholder="Enter new strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '0.25rem',
                    }}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordErrors.newPassword && <p style={errorTextStyle}>{passwordErrors.newPassword}</p>}
              </div>

              <div>
                <label style={labelStyle}>
                  Confirm New Password <span style={{ color: '#38BDF8' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirmPassword) setPasswordErrors((p) => ({ ...p, confirmPassword: '' }));
                    }}
                    style={{
                      ...inputStyle,
                      paddingRight: '2.5rem',
                      borderColor: passwordErrors.confirmPassword ? '#EF4444' : undefined,
                    }}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '0.25rem',
                    }}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordErrors.confirmPassword && <p style={errorTextStyle}>{passwordErrors.confirmPassword}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  backgroundColor: '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.6rem 1.45rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  opacity: passwordLoading ? 0.7 : 1,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.04em',
                }}
              >
                {passwordLoading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>

        {/* ─── 3. Multi-Device Session Revocation Section ─── */}
        <div style={{ ...cardStyle, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F87171', margin: 0 }}>
                Multi-Device Session Revocation
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0.15rem 0 0 0' }}>
                Terminate active sessions on other computers, phones, or shared browsers
              </p>
            </div>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            If you signed in on a public or shared device, you can revoke access for all other active browser sessions.
            All other devices will be immediately required to log in with current credentials.
          </p>

          <form onSubmit={handleLogoutOtherDevices} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>
                Enter Current Password to Confirm Invalidation <span style={{ color: '#38BDF8' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSessionPassword ? 'text' : 'password'}
                  required
                  value={sessionPassword}
                  onChange={(e) => {
                    setSessionPassword(e.target.value);
                    if (sessionErrors.sessionPassword) setSessionErrors((p) => ({ ...p, sessionPassword: '' }));
                  }}
                  style={{
                    ...inputStyle,
                    paddingRight: '2.5rem',
                    borderColor: sessionErrors.sessionPassword ? '#EF4444' : undefined,
                  }}
                  placeholder="Enter current password to authorize revocation"
                />
                <button
                  type="button"
                  onClick={() => setShowSessionPassword(!showSessionPassword)}
                  aria-label={showSessionPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0.25rem',
                  }}
                >
                  {showSessionPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {sessionErrors.sessionPassword && <p style={errorTextStyle}>{sessionErrors.sessionPassword}</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={sessionLoading}
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38BDF8',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: sessionLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {sessionLoading ? 'Revoking Sessions...' : 'Revoke All Other Device Sessions'}
              </button>

              <button
                type="button"
                onClick={handleLogoutAllDevices}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#F87171',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Sign Out Everywhere (All Devices)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
