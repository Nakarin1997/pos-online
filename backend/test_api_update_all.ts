import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to test update via API...`);

  for (const p of products) {
    console.log(`Testing update for product: ${p.id} - ${p.name}`);
    try {
      const updateData = {
        name: String(p.name).includes(" API") ? p.name : p.name + " API",
        sku: p.sku,
        price: Number(p.price),
        cost: Number(p.cost),
        stock: p.stock,
        categoryId: p.categoryId,
        isActive: p.isActive,
      };

      const res = await fetch(`http://localhost:3002/products/${p.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      const resData = await res.json().catch(() => null);
      if (!res.ok) {
        console.error(`Failed for ${p.id}: HTTP ${res.status}`, resData);
      } else {
        console.log(`Success for ${p.id}: HTTP ${res.status}`);
      }
    } catch (error: any) {
      console.error(`Error for ${p.id}:`, error.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
