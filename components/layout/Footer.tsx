'use client';

import React from 'react';
import Link from 'next/link';

const FOOTER_LINKS = {
  'COMPANY': [
    { href: '/about', label: 'About' },
    { href: '/leadership', label: 'Leadership' },
    { href: '/careers-partnerships', label: 'Careers & Partnerships' },
  ],
  'SOLUTIONS': [
    { href: '/services#ai', label: 'AI Systems' },
    { href: '/services#software', label: 'Business Software' },
    { href: '/services#automation', label: 'Automation' },
    { href: '/services#products', label: 'Digital Products' },
  ],
  'TECHNOLOGY': [
    { href: '/technologies/artificial-intelligence', label: 'Artificial Intelligence' },
    { href: '/technologies/machine-learning', label: 'Machine Learning' },
    { href: '/technologies/cloud-systems', label: 'Cloud Systems' },
    { href: '/technologies/data-systems', label: 'Data Systems' },
  ],
  'WORK': [
    { href: '/work', label: 'Client Work' },
    { href: '/products', label: 'Software Products' },
  ],
  'CONNECT': [
    { href: '/contact', label: 'Start a Project' },
  ]
};

export default function Footer({
  companyName = 'QUANTUM AI',
  tagline = 'Intelligence, engineered into the way organizations work.',
  email = 'hello@quantumai.dev',
  socials,
  copyright,
}: {
  companyName?: string;
  tagline?: string;
  email?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  copyright?: string;
}) {
  const currentYear = new Date().getFullYear();
  const displayCopyright = copyright || `© ${currentYear} ${companyName}. All rights reserved.`;

  return (
    <footer className="relative z-20 bg-q-void border-t border-q-border-soft pt-16 pb-8 md:pt-24 md:pb-12">
      <div className="q-container">
        
        {/* Top Statement */}
        <div className="mb-16 md:mb-24">
          <h2 className="q-h2 text-q-white max-w-3xl">
            {tagline}
          </h2>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12 mb-20">
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="flex flex-col gap-5">
              <h3 className="q-metadata text-q-subtle">
                {title}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-q-muted hover:text-q-white transition-colors duration-q-base outline-none focus-visible:ring-2 focus-visible:ring-q-focus rounded-sm inline-block"
                      style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Legal / Social */}
        <div className="pt-8 border-t border-q-border-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="flex flex-col gap-2">
            <span className="q-metadata text-q-white">
              {email}
            </span>
            <span className="q-metadata text-q-subtle">
              {displayCopyright}
            </span>
          </div>

          {/* Social Links */}
          {socials && (
            <div className="flex gap-4">
              {Object.entries(socials).filter(([_, url]) => Boolean(url)).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="q-metadata text-q-muted hover:text-q-violet transition-colors duration-q-base outline-none focus-visible:ring-2 focus-visible:ring-q-focus rounded-sm"
                  aria-label={`${companyName} on ${platform}`}
                >
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
