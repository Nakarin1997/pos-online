import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async create(createMemberDto: CreateMemberDto) {
    const existing = await this.prisma.member.findUnique({
      where: { phone: createMemberDto.phone },
    });
    if (existing) throw new ConflictException('Phone number already exists');

    const bonusPointsStr = await this.settingsService.getSettingValue(
      'SIGNUP_BONUS_POINTS',
    );
    const expiryDaysStr =
      await this.settingsService.getSettingValue('POINT_EXPIRY_DAYS');

    const bonusPoints = parseInt(bonusPointsStr, 10) || 0;
    const expiryDays = parseInt(expiryDaysStr, 10) || 365;

    let expiresAt: Date | undefined;
    if (expiryDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
    }

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          ...createMemberDto,
          points: bonusPoints, // Cache total
        },
      });

      if (bonusPoints > 0) {
        await tx.pointTransaction.create({
          data: {
            memberId: member.id,
            amount: bonusPoints,
            type: 'EARN',
            expiresAt,
            balance: bonusPoints,
          },
        });
      }

      return member;
    });
  }

  findAll() {
    return this.prisma.member.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    try {
      return await this.prisma.member.update({
        where: { id },
        data: updateMemberDto,
      });
    } catch {
      throw new NotFoundException('Member not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.member.delete({ where: { id } });
      return { message: 'Member deleted' };
    } catch {
      throw new NotFoundException('Member not found');
    }
  }
}
