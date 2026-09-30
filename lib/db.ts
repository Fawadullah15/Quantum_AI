const prisma = {
  leadership: { findMany: async () => [] },
  siteSettings: { findFirst: async () => ({}), findMany: async () => [] },
  product: { findMany: async () => [], findUnique: async () => null },
  careerApplication: { findMany: async () => [] },
  caseStudy: { findMany: async () => [], findUnique: async () => null },
  blogPost: { findMany: async () => [], findUnique: async () => null },
  service: { findMany: async () => [], findUnique: async () => null },
  founder: { findMany: async () => [], findUnique: async () => null },
  client: { findMany: async () => [], findUnique: async () => null },
  technology: { findMany: async () => [], findUnique: async () => null },
  testimonial: { findMany: async () => [], findUnique: async () => null },
};
export default prisma;
export { prisma };
