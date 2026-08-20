'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AccountSettingsClient({ user }: { user: { id: string; name: string; email: string; role: string; tokenVersion: number } }) {
  const router = useRouter();

  // Profile update form state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Session revocation state
  const [sessionPassword, setSessionPassword] = useState('');
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionMsg, setSessionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const res = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PROFILE',
          currentPassword: profilePassword,
          newName: name,
          newEmail: email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMsg({ type: 'success', text: 'Username / Profile updated successfully.' });
        setProfilePassword('');
        router.refresh();
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error occurred.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);

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
        setPasswordMsg({ type: 'success', text: 'Password changed successfully! Keep your credentials secure.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error occurred.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoutOtherDevices = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionLoading(true);
    setSessionMsg(null);

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
        setSessionMsg({
          type: 'success',
          text: '✓ All other active sessions have been terminated. Other logged-in devices will be prompted to log in again.',
        });
        setSessionPassword('');
      } else {
        setSessionMsg({ type: 'error', text: data.error || 'Failed to revoke other sessions.' });
      }
    } catch {
      setSessionMsg({ type: 'error', text: 'Network error occurred.' });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (confirm('Are you sure you want to log out of ALL devices including this one? You will be redirected to the login screen.')) {
      try {
        await fetch('/api/admin/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'LOGOUT_ALL_DEVICES' }),
        });
        await signOut({ callbackUrl: '/admin/login' });
      } catch {
        await signOut({ callbackUrl: '/admin/login' });
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: '#F8FAFC' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          Account Security & Credentials
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
          Manage administrator username, password encryption, and multi-device session revocation.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* ─── 1. Admin Username / Profile ─── */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Admin Profile & Username
          </h2>

          {profileMsg && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${profileMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
                color: profileMsg.type === 'success' ? '#34D399' : '#F87171',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.875rem',
              }}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  Admin Name / Username *
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  Admin Email *
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '6px' }}>
                Current Password (required to save changes) *
              </label>
              <input
                required
                type="password"
                placeholder="Enter current password to authorize changes"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 20px',
                backgroundColor: '#1677FF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: profileLoading ? 'wait' : 'pointer',
              }}
            >
              {profileLoading ? 'Saving...' : 'Update Account Profile'}
            </button>
          </form>
        </div>

        {/* ─── 2. Password Change ─── */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Change Password
          </h2>

          {passwordMsg && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${passwordMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
                color: passwordMsg.type === 'success' ? '#34D399' : '#F87171',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.875rem',
              }}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '6px' }}>
                Current Password *
              </label>
              <input
                required
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  New Password (min 8 chars) *
                </label>
                <input
                  required
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  Confirm New Password *
                </label>
                <input
                  required
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 20px',
                backgroundColor: '#1677FF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: passwordLoading ? 'wait' : 'pointer',
              }}
            >
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* ─── 3. Session Revocation & Multi-Device Security ─── */}
        <div style={{ backgroundColor: '#0B132B', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Multi-Device Session Revocation
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '16px', lineHeight: 1.6 }}>
            If you suspect unauthorized access or logged in from a shared computer, invalidate other active browser sessions below.
          </p>

          {sessionMsg && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: sessionMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${sessionMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
                color: sessionMsg.type === 'success' ? '#34D399' : '#F87171',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.875rem',
              }}
            >
              {sessionMsg.text}
            </div>
          )}

          <form onSubmit={handleLogoutOtherDevices} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8125rem', marginBottom: '6px' }}>
                Enter Current Password to Confirm Invalidation *
              </label>
              <input
                required
                type="password"
                placeholder="Enter current password"
                value={sessionPassword}
                onChange={(e) => setSessionPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={sessionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: sessionLoading ? 'wait' : 'pointer',
                }}
              >
                {sessionLoading ? 'Invalidating...' : 'Log Out All Other Devices'}
              </button>

              <button
                type="button"
                onClick={handleLogoutAllDevices}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#F87171',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Log Out of All Devices (Include This One)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: '#0F172A',
  border: '1px solid #334155',
  borderRadius: '6px',
  color: '#F8FAFC',
  fontSize: '0.875rem',
};
