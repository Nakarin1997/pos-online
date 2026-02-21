import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log('Total products:', products.length);
  if (products.length > 0) {
    const p = products[0];
    console.log('First product:', p);
    try {
      const updated = await prisma.product.update({
        where: { id: p.id },
        data: { name: p.name + ' updated' },
      });
      console.log('Update success:', updated);
    } catch (e) {
      console.error('Update failed:', e);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
