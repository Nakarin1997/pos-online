import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst();
  console.log("Found product:", p);
  if (p) {
    try {
      const updated = await prisma.product.update({
        where: { id: p.id },
        data: { name: p.name + " updated" },
      });
      console.log("Update success:", updated);
    } catch (e) {
      console.error("Update failed:", e);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
