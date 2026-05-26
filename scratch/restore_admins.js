const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailsToPromote = [
  'axelinomanibuy3@gmail.com',
  'diptabaskaraosis@gmail.com',
  'axelinonitian755@gmail.com',
  't47375844@gmail.com'
];

async function main() {
  console.log("Restoring admin accounts...");
  for (const email of emailsToPromote) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: {
        email,
        name: email.split('@')[0],
        role: 'ADMIN'
      }
    });
    console.log(`User ${user.email} is now ADMIN (ID: ${user.id})`);
  }
  console.log("All admin accounts restored/promoted.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
