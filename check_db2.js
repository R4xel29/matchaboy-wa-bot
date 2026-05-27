const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.storeSettings.findFirst();
  console.log('StoreSettings in DB:', JSON.stringify(settings, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

