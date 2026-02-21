import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // App Default Settings
  private defaultSettings = [
    { key: 'POINTS_PER_THB', value: '100' },          // 100 THB = 1 Point
    { key: 'POINT_EXPIRY_DAYS', value: '365' },       // Points expire in 1 year
    { key: 'SIGNUP_BONUS_POINTS', value: '50' },      // 50 Points for new members
  ];

  async getSettings() {
    const records = await this.prisma.settings.findMany();
    const settingsMap = new Map(records.map((r: any) => [r.key, r.value]));

    // Merge with defaults
    return this.defaultSettings.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = settingsMap.has(curr.key) ? (settingsMap.get(curr.key) as string) : curr.value;
      return acc;
    }, {});
  }

  async updateSettings(updates: Record<string, string>) {
    const promises = Object.entries(updates).map(([key, value]) => {
      return this.prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });
    
    await Promise.all(promises);
    return this.getSettings();
  }

  async getSettingValue(key: string): Promise<string> {
    const record = await this.prisma.settings.findUnique({ where: { key } });
    if (record) return record.value;
    
    // Fallback to default
    const def = this.defaultSettings.find(s => s.key === key);
    return def ? def.value : '';
  }
}
