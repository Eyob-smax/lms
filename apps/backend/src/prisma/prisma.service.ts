import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
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
