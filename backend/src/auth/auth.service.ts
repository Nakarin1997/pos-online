import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.isActive && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials or inactive account',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user,
    };
  }

  // Used only once to initialize the first admin
  async seedAdmin() {
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (existingAdmin) return { message: 'Admin already exists' };

    const hashedPassword = await bcrypt.hash('1111', 10);
    const admin = await this.prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@pos.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    return { message: 'Admin created', email: admin.email };
  }

  // Seed demo cashier and manager for demo purposes
  async seedDemoUsers() {
    const usersCreated = [];
    const demoUsers = [
      { name: 'Demo Cashier', email: 'cashier@pos.com', password: 'cashier123', role: 'CASHIER' },
      { name: 'Demo Manager', email: 'manager@pos.com', password: 'manager123', role: 'MANAGER' },
    ] as const;

    for (const demoUser of demoUsers) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: demoUser.email },
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(demoUser.password, 10);
        const newUser = await this.prisma.user.create({
          data: {
            name: demoUser.name,
            email: demoUser.email,
            password: hashedPassword,
            role: demoUser.role,
          },
        });
        usersCreated.push(newUser.email);
      }
    }

    if (usersCreated.length > 0) {
      return { message: `Demo users created`, emails: usersCreated };
    }
    return { message: 'Demo users already exist' };
  }
}
