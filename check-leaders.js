const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const leaders = await db.leadership.findMany({ orderBy: { displayOrder: 'asc' } });
  console.log('LEADERSHIP RECORDS:', JSON.stringify(leaders, null, 2));
}

main().finally(() => db.$disconnect());
