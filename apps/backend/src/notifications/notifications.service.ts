import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { count: res.count };
  }

  async adminBroadcast(title: string, message: string, type = 'INFO', link?: string, targetRole?: string) {
    const whereClause = targetRole ? { role: targetRole as any } : {};
    const users = await this.prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (users.length === 0) {
      return { count: 0 };
    }

    const data = users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      link: link || null,
      actionUrl: link || null,
      isRead: false,
    }));

    const res = await this.prisma.notification.createMany({ data });
    return { count: res.count };
  }

  async createNotification(userId: string, title: string, message: string, type = 'INFO', link?: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link || null,
        actionUrl: link || null,
        isRead: false,
      },
    });
  }

  async notifyAllUsers(title: string, message: string, type = 'INFO', link?: string) {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    if (users.length === 0) return { count: 0 };

    const data = users.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      link: link || null,
      actionUrl: link || null,
      isRead: false,
    }));

    const res = await this.prisma.notification.createMany({ data });
    return { count: res.count };
  }
}
