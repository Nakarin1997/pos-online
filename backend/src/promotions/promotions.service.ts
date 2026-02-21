import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  create(createPromotionDto: CreatePromotionDto) {
    const { conditions, rewards, ...promoData } = createPromotionDto;
    return this.prisma.promotion.create({
      data: {
        ...promoData,
        conditions: {
          create: conditions || [],
        },
        rewards: {
          create: rewards || [],
        },
      },
      include: {
        conditions: true,
        rewards: true,
      },
    });
  }

  findAll() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        conditions: true,
        rewards: true,
      },
    });
  }

  async findOne(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        conditions: true,
        rewards: true,
      },
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async update(id: string, updatePromotionDto: UpdatePromotionDto) {
    try {
      const { conditions, rewards, ...promoData } = updatePromotionDto;

      return await this.prisma.promotion.update({
        where: { id },
        data: {
          ...promoData,
          ...(conditions && {
            conditions: {
              deleteMany: {},
              create: conditions,
            },
          }),
          ...(rewards && {
            rewards: {
              deleteMany: {},
              create: rewards,
            },
          }),
        },
        include: {
          conditions: true,
          rewards: true,
        },
      });
    } catch {
      throw new NotFoundException('Promotion not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.promotion.delete({ where: { id } });
      return { message: 'Promotion deleted' };
    } catch {
      throw new NotFoundException('Promotion not found');
    }
  }
}
