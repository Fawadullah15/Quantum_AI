import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { computeEffectiveStatus } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return { title: 'Announcement | Quantum AI' };
    }
    return {
      title: `${campaign.headline || campaign.name} | Quantum AI Announcement`,
      description: campaign.description || 'Official announcement and news from Quantum AI.',
      openGraph: campaign.imageUrl
        ? {
            images: [{ url: campaign.imageUrl, alt: campaign.imageAlt || campaign.name }],
          }
        : undefined,
    };
  } catch {
    return { title: 'Announcement | Quantum AI' };
  }
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { id } = await params;

  let campaign: any = null;
  try {
    campaign = await prisma.campaign.findUnique({ where: { id } });
  } catch (err) {
    console.error('Error fetching campaign detail:', err);
  }

  if (!campaign) {
    notFound();
  }

  const effectiveStatus = computeEffectiveStatus(campaign);
  const formattedDate = new Date(campaign.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      style={{
        minHeight: '80vh',
        padding: '7rem 1.5rem 5rem 1.5rem',
        maxWidth: '920px',
        margin: '0 auto',
        color: '#F8FAFC',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      {/* ── Breadcrumb & Back Link ── */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#67E8F9',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.04em',
            padding: '0.35rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(20, 184, 166, 0.08)',
            border: '1px solid rgba(20, 184, 166, 0.25)',
            transition: 'background-color 0.2s, border-color 0.2s',
          }}
        >
          ← Back to Overview
        </Link>
      </div>

      {/* ── Announcement Card Container ── */}
      <div
        style={{
          backgroundColor: 'rgba(5, 12, 14, 0.92)',
          border: '1px solid rgba(103, 232, 249, 0.22)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(20, 184, 166, 0.1)',
        }}
      >
        {/* Creative Image Hero Header */}
        {campaign.imageUrl && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              maxHeight: '480px',
              backgroundColor: '#020708',
              borderBottom: '1px solid rgba(103, 232, 249, 0.15)',
            }}
          >
            <Image
              src={campaign.imageUrl}
              alt={campaign.imageAlt || campaign.headline || campaign.name}
              fill
              sizes="(max-width: 920px) 100vw, 920px"
              style={{ objectFit: 'cover' }}
              priority
              unoptimized={true}
            />
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '2.5rem 2.25rem' }}>
          {/* Header Metadata Tag Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
            }}
          >
            {campaign.badge && (
              <span
                style={{
                  backgroundColor: 'rgba(20, 184, 166, 0.2)',
                  border: '1px solid #14B8A6',
                  color: '#67E8F9',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '3px 10px',
                  borderRadius: '14px',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {campaign.badge}
              </span>
            )}

            <span
              style={{
                fontSize: '0.75rem',
                color: '#64748B',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              TRANSMISSION • {formattedDate}
            </span>

            {effectiveStatus !== 'PUBLISHED' && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#F59E0B',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                STATUS: {effectiveStatus}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.45rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#FFFFFF',
              margin: '0 0 1.25rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            {campaign.headline || campaign.name}
          </h1>

          {/* Primary Lead Description */}
          {campaign.description && (
            <p
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.65,
                color: '#E2E8F0',
                margin: '0 0 1.75rem 0',
                fontWeight: 400,
              }}
            >
              {campaign.description}
            </p>
          )}

          {/* Supporting Details / Body Text */}
          {campaign.supportingText && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderLeft: '3px solid #14B8A6',
                borderRadius: '0 8px 8px 0',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                color: '#94A3B8',
                fontSize: '0.95rem',
                lineHeight: 1.7,
              }}
            >
              {campaign.supportingText}
            </div>
          )}

          {/* Action Destination Link */}
          {campaign.destinationUrl && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(103, 232, 249, 0.12)',
              }}
            >
              <Link
                href={campaign.destinationUrl}
                target={campaign.openInNewTab ? '_blank' : '_self'}
                rel={campaign.openInNewTab ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#14B8A6',
                  color: '#020708',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: '0 4px 18px rgba(20, 184, 166, 0.35)',
                  transition: 'background-color 0.2s, transform 0.2s',
                }}
              >
                {campaign.ctaLabel || 'Explore More'} →
              </Link>

              {campaign.openInNewTab && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748B',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  (Opens in external tab)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer Signature ── */}
      <div
        style={{
          marginTop: '3rem',
          textAlign: 'center',
          color: '#64748B',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        QUANTUM AI • OFFICIAL ANNOUNCEMENTS &amp; TRANSMISSIONS
      </div>
    </article>
  );
}
