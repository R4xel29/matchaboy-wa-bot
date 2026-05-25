const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("Categories in DB:");
  console.log(categories);
  const products = await prisma.product.findMany();
  console.log(`Total products: ${products.length}`);
  console.log("Product categories and badges:");
  products.forEach(p => console.log(`- ${p.name} (${p.badge}): catId=${p.categoryId}`));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
