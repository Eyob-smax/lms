import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CertificateProcessor } from './processors/certificate.processor';
import { AICourseProcessor } from './processors/ai-course.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue(
      { name: 'certificate-generation' },
      { name: 'ai-course-generation' },
      { name: 'notification-reminders' }
    ),
  ],
  providers: [CertificateProcessor, AICourseProcessor],
  exports: [BullModule],
})
export class JobsModule {}
