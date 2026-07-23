import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('certificate-generation')
export class CertificateProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificateProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background PDF Certificate generation job ${job.id} for enrollment: ${job.data.enrollmentId}`);

    // Offloaded PDF generation task
    const { certificateId, userId, courseTitle } = job.data;

    // Simulate heavy background PDF rendering or storage upload
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(`PDF Certificate ${certificateId} generated successfully for User ${userId}`);
    return { status: 'SUCCESS', certificateId, pdfPath: `/certificates/${certificateId}.pdf` };
  }
}
