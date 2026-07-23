import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      this.logger.warn('⚠️ Database connection failed. Ensure PostgreSQL is running in Docker environment.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (err) {
      // Ignore disconnect errors on teardown
    }
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'test') {
      const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'));
      return Promise.all(
        models.map((modelKey) => {
          if (typeof modelKey === 'string' && (this as any)[modelKey]?.deleteMany) {
            return (this as any)[modelKey].deleteMany();
          }
          return Promise.resolve();
        })
      );
    }
  }
}
