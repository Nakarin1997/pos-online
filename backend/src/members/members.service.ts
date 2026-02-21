import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(createMemberDto: CreateMemberDto) {
    const existing = await this.prisma.member.findUnique({
      where: { phone: createMemberDto.phone },
    });
    if (existing) throw new ConflictException('Phone number already exists');

    return this.prisma.member.create({
      data: createMemberDto,
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
