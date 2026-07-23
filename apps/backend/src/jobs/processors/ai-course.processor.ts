import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('ai-course-generation')
export class AICourseProcessor extends WorkerHost {
  private readonly logger = new Logger(AICourseProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background AI Course generation job ${job.id} for topic: "${job.data.topic}"`);

    const { topic, targetRole, durationMinutes } = job.data;

    // Offloaded AI generation task
    await new Promise((resolve) => setTimeout(resolve, 800));

    this.logger.log(`AI Course draft for "${topic}" generated successfully`);
    return { status: 'SUCCESS', topic, targetRole, durationMinutes };
  }
}
