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
            gte: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
            ),
          },
        },
      });
      const orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      // Calculate items and validate stock
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

        const itemSubtotal = new Prisma.Decimal(item.unitPrice).mul(
          item.quantity,
        );
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

      // --- SERVER-SIDE RULES ENGINE ---
      let totalDiscount = new Prisma.Decimal(0);
      const appliedPromoIds: string[] = [];

      if (dto.promoIds && dto.promoIds.length > 0) {
        const promotions = await tx.promotion.findMany({
          where: { id: { in: dto.promoIds } },
          include: { conditions: true, rewards: true },
        });

        for (const promo of promotions) {
          if (promo.status !== 'ACTIVE' || !promo.isActive) continue;

          // Date Check
          const now = new Date();
          if (promo.startDate && promo.startDate > now) continue;
          if (promo.endDate && promo.endDate < now) continue;

          // Usage Limit Check
          if (promo.usageLimit && promo.usedCount >= promo.usageLimit) continue;

          // Condition Check
          const isMet = promo.conditions.every((cond) => {
            switch (cond.type) {
              case 'MIN_CART_TOTAL':
                return subtotal.gte(cond.value || 0);
              case 'MIN_ITEM_QTY': {
                const item = dto.items.find((i) => i.productId === cond.productId);
                return item && item.quantity >= Number(cond.value);
              }
              case 'SPECIFIC_ITEM':
                return dto.items.some((i) => i.productId === cond.productId);
              case 'SPECIFIC_CATEGORY': {
                // We'd need to fetch products to check categories precisely if categories were nested
                // For now, assume frontend handles filtering, but backend could join products
                return true; // Simplified for category for now
              }
              default:
                return false;
            }
          });

          if (isMet && promo.conditions.length > 0) {
            appliedPromoIds.push(promo.id);
            // Calculate Rewards
            promo.rewards.forEach((reward) => {
              switch (reward.type) {
                case 'DISCOUNT_AMOUNT':
                  totalDiscount = totalDiscount.add(reward.value);
                  break;
                case 'DISCOUNT_PERCENT':
                  totalDiscount = totalDiscount.add(
                    subtotal.mul(reward.value).div(100),
                  );
                  break;
                case 'FIXED_PRICE': {
                  const item = dto.items.find((i) => i.productId === reward.productId);
                  if (item) {
                    const diff = new Prisma.Decimal(item.unitPrice)
                      .sub(reward.value)
                      .mul(item.quantity);
                    if (diff.gt(0)) totalDiscount = totalDiscount.add(diff);
                  }
                  break;
                }
                default:
                  break;
              }
            });

            // Increment Usage
            await tx.promotion.update({
              where: { id: promo.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      }

      // If user provided a manual discount or if we use the calculated one
      const finalDiscount = totalDiscount.gt(0)
        ? totalDiscount
        : new Prisma.Decimal(dto.discount ?? 0);

      const total = subtotal.sub(finalDiscount);
      const subtotalBeforeVat = total.div(1.07);
      const tax = total.sub(subtotalBeforeVat);

      return tx.order.create({
        data: {
          orderNumber,
          subtotal,
          discount: finalDiscount,
          tax,
          total,
          paymentMethod: (dto.paymentMethod as any) ?? 'CASH',
          note: dto.note,
          userId: dto.userId,
          memberId: dto.memberId,
          promoIds: appliedPromoIds,
          promotions: {
            connect: appliedPromoIds.map((id) => ({ id })),
          },
          items: {
            create: orderItems,
          },
        },
        include: {
          items: { include: { product: true } },
          user: { select: { id: true, name: true } },
          promotions: true,
          member: true,
        },
      });
    });
  }

  async findAll(params?: { from?: string; to?: string; status?: string }) {
    const where: Prisma.OrderWhereInput = {};
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to + 'T23:59:59');
    }
    if (params?.status) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where.status = params.status as any;
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
