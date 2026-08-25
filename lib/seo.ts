import type { Metadata } from 'next';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://quantumai-snowy.vercel.app';

export const SITE_NAME = 'Quantum AI';
export const DEFAULT_TITLE = 'Quantum AI | AI, Software & Automation Solutions';
export const DEFAULT_DESCRIPTION =
  'Quantum AI builds AI systems, custom business software, and automation for organizations that need better ways to operate.';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/quantum-q-logo.png`;

/**
 * Returns a clean absolute canonical URL
 */
export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = SITE_URL.replace(/\/+$/, '');
  return cleanPath === '/' ? base : `${base}${cleanPath}`;
}

interface CreateMetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  authors?: string[];
  noIndex?: boolean;
}

/**
 * Generates standardized Next.js Metadata with canonical URLs and Open Graph tags
 */
export function createPageMetadata({
  title,
  description,
  path = '',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  publishedTime,
  authors,
  noIndex = false,
}: CreateMetadataOptions): Metadata {
  const canonicalUrl = getCanonicalUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
        }
      : {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_US',
      type,
      images: [
        {
          url: image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(authors && { authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`],
    },
  };
}

/**
 * Organization Structured Data (JSON-LD)
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Quantum AI',
    alternateName: 'Quantum AI Engineering',
    url: SITE_URL,
    logo: `${SITE_URL}/quantum-q-logo.png`,
    description: DEFAULT_DESCRIPTION,
    email: 'hello@quantumai.dev',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Peshawar',
      addressRegion: 'Khyber Pakhtunkhwa',
      addressCountry: 'PK',
    },
    sameAs: [
      'https://github.com/Fawadullah15/Quantum_AI',
    ],
    knowsAbout: [
      'Artificial Intelligence Systems',
      'Machine Learning Engineering',
      'Custom Business Software',
      'Workflow Automation',
      'Enterprise Data Architecture',
      'Cloud Infrastructure',
      'Autonomous Multi-Agent Networks',
      'Retrieval-Augmented Generation (RAG)',
    ],
  };
}

/**
 * WebSite Structured Data (JSON-LD)
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Quantum AI',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: 'Quantum AI',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/quantum-q-logo.png`,
      },
    },
  };
}

/**
 * BreadcrumbList Structured Data (JSON-LD)
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}

/**
 * Article / BlogPosting Structured Data (JSON-LD)
 */
export function getArticleSchema(post: {
  title: string;
  excerpt?: string;
  slug: string;
  coverImage?: string | null;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  author?: string | null;
}) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const datePublished = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : new Date(post.createdAt).toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    url,
    datePublished,
    dateModified: datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: {
      '@type': 'Person',
      name: post.author || 'Quantum AI Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Quantum AI',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/quantum-q-logo.png`,
      },
    },
    ...(post.coverImage && {
      image: post.coverImage.startsWith('http')
        ? post.coverImage
        : `${SITE_URL}${post.coverImage.startsWith('/') ? '' : '/'}${post.coverImage}`,
    }),
  };
}

/**
 * Case Study / Software Application Structured Data (JSON-LD)
 */
export function getCaseStudySchema(study: {
  title: string;
  slug: string;
  problem: string;
  solution: string;
  industry: string;
  client: string;
  heroImage?: string | null;
  year?: number;
}) {
  const url = `${SITE_URL}/work/${study.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: study.title,
    headline: study.title,
    description: study.problem,
    url,
    genre: study.industry,
    creator: {
      '@type': 'Organization',
      name: 'Quantum AI',
      url: SITE_URL,
    },
    abstract: study.solution,
    ...(study.heroImage && {
      image: study.heroImage.startsWith('http')
        ? study.heroImage
        : `${SITE_URL}${study.heroImage.startsWith('/') ? '' : '/'}${study.heroImage}`,
    }),
  };
}

/**
 * FAQPage Structured Data (JSON-LD)
 */
export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Service Structured Data (JSON-LD)
 */
export function getServiceSchema(service: {
  name: string;
  slug: string;
  description: string;
  category?: string;
}) {
  const url = `${SITE_URL}/services/${service.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Quantum AI',
      url: SITE_URL,
    },
    serviceType: service.category || 'Software Engineering',
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
  };
}
