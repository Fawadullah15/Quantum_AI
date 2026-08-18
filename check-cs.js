const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const caseStudies = await db.caseStudy.findMany();
  console.log('ALL CASE STUDIES:', JSON.stringify(caseStudies, null, 2));
}

main().finally(() => db.$disconnect());
