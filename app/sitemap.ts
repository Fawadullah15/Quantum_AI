import { MetadataRoute } from 'next';
import prisma from '@/lib/db';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [caseStudies, products, posts, technologies, leadership] = await Promise.all([
    prisma.caseStudy.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.technology.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.leadership.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
  ]);

  // Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/services/ai-development`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services/custom-software-development`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services/business-automation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services/software-integration`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/services/digital-products`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/work`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/case-studies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/technology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/leadership`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/insights`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/industries`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/philosophy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/research`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/systems`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/careers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/careers-partnerships`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

  // Dynamic Case Studies
  const caseStudyUrls: MetadataRoute.Sitemap = caseStudies.map((item: any) => ({
    url: `${SITE_URL}/work/${item.slug}`,
    lastModified: item.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Dynamic Products
  const productUrls: MetadataRoute.Sitemap = products.map((item: any) => ({
    url: `${SITE_URL}/products/${item.slug}`,
    lastModified: item.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  // Dynamic Blog Posts
  const postUrls: MetadataRoute.Sitemap = posts.map((item: any) => ({
    url: `${SITE_URL}/blog/${item.slug}`,
    lastModified: item.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Dynamic Technology Items
  const fallbackTechSlugs = ['artificial-intelligence', 'machine-learning', 'cloud-systems', 'data-systems'];
  const techSlugs = technologies.length > 0
    ? technologies.map((t: any) => ({ slug: t.slug, updatedAt: t.updatedAt }))
    : fallbackTechSlugs.map(slug => ({ slug, updatedAt: new Date() }));

  const technologyUrls: MetadataRoute.Sitemap = techSlugs.map((item: any) => ({
    url: `${SITE_URL}/technologies/${item.slug}`,
    lastModified: item.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  // Dynamic Leadership Profiles
  const leadershipUrls: MetadataRoute.Sitemap = leadership.map((item: any) => ({
    url: `${SITE_URL}/leadership/${item.slug}`,
    lastModified: item.updatedAt || new Date(),
    changeFrequency: 'monthly',
    priority: 0.65,
  }));

  return [
    ...staticRoutes,
    ...caseStudyUrls,
    ...productUrls,
    ...postUrls,
    ...technologyUrls,
    ...leadershipUrls,
  ];
}
