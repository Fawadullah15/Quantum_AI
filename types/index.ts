export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SiteConfig {
  [key: string]: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  order: number;
  external: boolean;
}

export interface FounderType {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  github?: string | null;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFeatureType {
  id: string;
  productId: string;
  title: string;
  description: string;
  order: number;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: 'LIVE' | 'BETA' | 'IN_DEVELOPMENT' | 'PLANNED';
  heroImage?: string | null;
  demoUrl?: string | null;
  docsUrl?: string | null;
  features?: ProductFeatureType[];
  technologies: string;
  published: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseStudyMetricType {
  id: string;
  caseStudyId: string;
  label: string;
  value: string;
  description?: string | null;
}

export interface CaseStudyType {
  id: string;
  title: string;
  slug: string;
  client: string;
  industry: string;
  problem: string;
  solution: string;
  implementation: string;
  technologies: string;
  results: string;
  year: number;
  services: string;
  heroImage?: string | null;
  gallery: string;
  externalUrl?: string | null;
  metrics?: CaseStudyMetricType[];
  published: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceType {
  id: string;
  name: string;
  category: string;
  description: string;
  icon?: string | null;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnologyType {
  id: string;
  name: string;
  description: string;
  category: string;
  usage?: string | null;
  projects?: string | null;
  icon?: string | null;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPostType {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  tags: string;
  author: string;
  published: boolean;
  publishedAt?: Date | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ContactStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CLOSED' | 'ARCHIVED';

export interface ContactSubmissionType {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  projectType?: string | null;
  budget?: string | null;
  message: string;
  status: ContactStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaType {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  alt?: string | null;
  createdAt: Date;
}
