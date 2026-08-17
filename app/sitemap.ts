import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const [caseStudies, products, posts] = await Promise.all([
    prisma.caseStudy.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.product.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);

  const caseStudyUrls = caseStudies.map((item: any) => ({
    url: `${baseUrl}/work/${item.slug}`,
    lastModified: item.updatedAt,
  }));

  const productUrls = products.map((item: any) => ({
    url: `${baseUrl}/products/${item.slug}`,
    lastModified: item.updatedAt,
  }));

  const postUrls = posts.map((item: any) => ({
    url: `${baseUrl}/blog/${item.slug}`,
    lastModified: item.updatedAt,
  }));

  const staticRoutes = ['', '/about', '/contact', '/work', '/products', '/technology', '/blog'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...caseStudyUrls, ...productUrls, ...postUrls];
}
