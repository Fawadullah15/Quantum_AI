const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log('USERS:', JSON.stringify(users, null, 2));

  const techs = await db.technology.findMany({ select: { id: true, name: true, slug: true, published: true } });
  console.log('TECHNOLOGIES:', JSON.stringify(techs, null, 2));
}

main()
  .catch(e => console.error('DB Error:', e.message))
  .finally(() => db.$disconnect());
