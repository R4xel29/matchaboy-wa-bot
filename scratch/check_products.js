const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, image: true }
  });
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });
  console.log("Products in DB:", products.length);
  console.log("Categories in DB:", categories.length);
  if (products.length > 0) {
    console.log("First 3 products:", products.slice(0, 3));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
