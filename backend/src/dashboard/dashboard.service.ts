import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Today's orders
    const todayOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lt: endOfDay },
        status: 'COMPLETED',
      },
    });

    const todaySales = todayOrders.reduce(
      (acc, order) => acc.add(order.total),
      new Prisma.Decimal(0),
    );

    // Total products
    const totalProducts = await this.prisma.product.count({
      where: { isActive: true },
    });

    // Low stock products (stock < 10)
    const lowStockProducts = await this.prisma.product.findMany({
      where: { isActive: true, stock: { lt: 10 } },
      include: { category: true },
      orderBy: { stock: 'asc' },
      take: 10,
    });

    // Top selling products (last 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        return {
          product,
          totalSold: item._sum.quantity,
        };
      }),
    );

    // Recent orders
    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });

    return {
      todaySales: todaySales.toNumber(),
      todayOrderCount: todayOrders.length,
      totalProducts,
      lowStockProducts,
      topProducts: topProductDetails,
      recentOrders,
    };
  }
}
