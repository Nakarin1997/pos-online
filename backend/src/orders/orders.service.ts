import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // Generate order number: ORD-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.order.count({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          },
        },
      });
      const orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      // Calculate items
      const orderItems: Array<{
        productId: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        subtotal: Prisma.Decimal;
      }> = [];

      let subtotal = new Prisma.Decimal(0);

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          );
        }

        const itemSubtotal = new Prisma.Decimal(item.unitPrice).mul(item.quantity);
        subtotal = subtotal.add(itemSubtotal);

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          subtotal: itemSubtotal,
        });

        // Deduct stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const discount = new Prisma.Decimal(dto.discount ?? 0);
      const tax = subtotal.sub(discount).mul(0.07); // 7% VAT
      const total = subtotal.sub(discount).add(tax);

      return tx.order.create({
        data: {
          orderNumber,
          subtotal,
          discount,
          tax,
          total,
          paymentMethod: (dto.paymentMethod as any) ?? 'CASH',
          note: dto.note,
          userId: dto.userId,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, name: true } },
        },
      });
    });
  }

  async findAll(params?: { from?: string; to?: string; status?: string }) {
    const where: any = {};
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to + 'T23:59:59');
    }
    if (params?.status) {
      where.status = params.status;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async cancel(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed orders can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, name: true } },
        },
      });
    });
  }
}
