import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CertificateStatus, EnrollmentStatus } from '@prisma/client';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestCertificateDto } from './dto/request-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async requestCertificate(dto: RequestCertificateDto, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        course: { select: { id: true, title: true, courseCode: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID "${dto.enrollmentId}" not found`);
    }

    if (enrollment.userId !== userId) {
      throw new BadRequestException('Cannot request certificate for an enrollment belonging to another user');
    }

    if (enrollment.status !== EnrollmentStatus.COMPLETED && enrollment.overallProgressPct < 100) {
      throw new BadRequestException('Cannot request certificate for an incomplete course. Please complete all lessons and required assessments first.');
    }

    const existingCert = await this.prisma.certificate.findUnique({
      where: { enrollmentId: dto.enrollmentId },
    });

    if (existingCert) {
      if (existingCert.status === CertificateStatus.APPROVED) {
        return {
          message: 'Certificate has already been issued for this course',
          certificate: existingCert,
        };
      }
      if (existingCert.status === CertificateStatus.REQUESTED) {
        return {
          message: 'Certificate request is already pending admin review and approval',
          certificate: existingCert,
        };
      }
    }

    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const certificateCode = `CERT-${year}-${randomHex}`;

    const certificate = await this.prisma.certificate.create({
      data: {
        enrollmentId: dto.enrollmentId,
        userId,
        certificateCode,
        status: CertificateStatus.REQUESTED,
        requestedAt: new Date(),
      },
      include: {
        enrollment: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
            course: { select: { id: true, title: true, courseCode: true } },
          },
        },
      },
    });

    return {
      message: 'Certificate request submitted successfully. Awaiting admin approval.',
      certificate,
    };
  }

  async getPendingRequests() {
    return this.prisma.certificate.findMany({
      where: { status: CertificateStatus.REQUESTED },
      orderBy: { requestedAt: 'desc' },
      include: {
        enrollment: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
            course: { select: { id: true, title: true, courseCode: true, category: true } },
          },
        },
      },
    });
  }

  async getAllCertificates() {
    return this.prisma.certificate.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        enrollment: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
            course: { select: { id: true, title: true, courseCode: true, category: true } },
          },
        },
      },
    });
  }

  async approveCertificate(certificateId: string, adminUserId: string) {
    const cert = await this.prisma.certificate.findUnique({ 
      where: { id: certificateId },
      include: { enrollment: { include: { course: true } } }
    });
    if (!cert) {
      throw new NotFoundException(`Certificate request with ID "${certificateId}" not found`);
    }

    const updated = await this.prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: CertificateStatus.APPROVED,
        approvedAt: new Date(),
        issuedAt: new Date(),
        approvedBy: adminUserId,
      },
      include: {
        enrollment: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
            course: { select: { id: true, title: true, courseCode: true } },
          },
        },
      },
    });

    await this.notificationsService
      .createNotification(
        updated.userId,
        'Certificate Approved! 🎉',
        `Your certificate for "${updated.enrollment?.course?.title || 'Course'}" has been approved and issued!`,
        'SUCCESS',
        '/certificates',
      )
      .catch((err) => console.warn('Failed to send approval notification:', err));

    return updated;
  }

  async rejectCertificate(certificateId: string, adminUserId: string, reason?: string) {
    const cert = await this.prisma.certificate.findUnique({ 
      where: { id: certificateId },
      include: { enrollment: { include: { course: true } } }
    });
    if (!cert) {
      throw new NotFoundException(`Certificate request with ID "${certificateId}" not found`);
    }

    const updated = await this.prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: CertificateStatus.REJECTED,
        approvedBy: adminUserId,
        rejectionReason: reason || 'Certificate request rejected by training manager',
      },
      include: {
        enrollment: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
            course: { select: { id: true, title: true, courseCode: true } },
          },
        },
      },
    });

    await this.notificationsService
      .createNotification(
        updated.userId,
        'Certificate Request Rejected',
        `Your certificate request for "${updated.enrollment?.course?.title || 'Course'}" was not approved. Reason: ${updated.rejectionReason}`,
        'WARNING',
        '/certificates',
      )
      .catch((err) => console.warn('Failed to send rejection notification:', err));

    return updated;
  }

  async getUserCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        enrollment: {
          include: {
            course: { select: { id: true, title: true, courseCode: true, category: true } },
          },
        },
      },
    });
  }

  async verifyCertificate(certificateCode: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { certificateCode },
      include: {
        enrollment: {
          include: {
            user: { select: { name: true, email: true, department: true } },
            course: { select: { id: true, title: true, courseCode: true, category: true } },
          },
        },
      },
    });

    if (!cert || cert.status !== CertificateStatus.APPROVED) {
      throw new NotFoundException(`Certificate with code "${certificateCode}" not found or invalid`);
    }

    return {
      valid: true,
      certificateCode: cert.certificateCode,
      status: cert.status,
      issuedAt: cert.issuedAt,
      student: {
        name: cert.enrollment.user.name,
        email: cert.enrollment.user.email,
        department: cert.enrollment.user.department,
      },
      course: {
        id: cert.enrollment.course.id,
        title: cert.enrollment.course.title,
        courseCode: cert.enrollment.course.courseCode,
        category: cert.enrollment.course.category,
      },
      finalScorePct: cert.enrollment.finalScorePct || 100,
    };
  }

  async findCertificate(idOrCode: string) {
    let cert = await this.prisma.certificate.findUnique({
      where: { id: idOrCode },
      include: {
        enrollment: {
          include: {
            user: { select: { name: true, email: true, department: true } },
            course: { select: { id: true, title: true, courseCode: true } },
          },
        },
      },
    });

    if (!cert) {
      cert = await this.prisma.certificate.findUnique({
        where: { certificateCode: idOrCode },
        include: {
          enrollment: {
            include: {
              user: { select: { name: true, email: true, department: true } },
              course: { select: { id: true, title: true, courseCode: true } },
            },
          },
        },
      });
    }

    if (!cert) {
      throw new NotFoundException(`Certificate "${idOrCode}" not found`);
    }

    return cert;
  }

  async generatePdfStream(idOrCode: string, res: Response) {
    const cert = await this.findCertificate(idOrCode);

    if (cert.status !== CertificateStatus.APPROVED) {
      throw new BadRequestException('Cannot generate PDF for unapproved certificate requests');
    }

    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="certificate-${cert.certificateCode}.pdf"`);

    doc.pipe(res);

    // Decorative Borders
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#3525cd');
    doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).lineWidth(1).stroke('#6cf8bb');

    // Header Logo & Branding
    doc.fillColor('#3525cd').fontSize(16).text('LMS ENTERPRISE | BPO TRAINING PORTAL', 40, 60, { align: 'center' });
    doc.moveDown(0.6);

    // Title
    doc.fillColor('#1e1b4b').fontSize(30).text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown(0.8);

    // Subtitle
    doc.fillColor('#475569').fontSize(14).text('This is to certify that', { align: 'center' });
    doc.moveDown(0.5);

    // Student Name & Department
    doc.fillColor('#3525cd').fontSize(26).text(cert.enrollment.user.name, { align: 'center' });
    doc.fillColor('#64748b').fontSize(12).text(`Department: ${cert.enrollment.user.department}`, { align: 'center' });
    doc.moveDown(1);

    // Completion Description
    doc.fillColor('#475569').fontSize(14).text('has successfully completed the BPO training course:', { align: 'center' });
    doc.moveDown(0.5);

    // Course Title & Code
    doc.fillColor('#0f172a').fontSize(22).text(`"${cert.enrollment.course.title}"`, { align: 'center' });
    doc.fillColor('#64748b').fontSize(12).text(`Course Code: ${cert.enrollment.course.courseCode}`, { align: 'center' });
    doc.moveDown(1.5);

    // Footer Audit Info
    const issuedDate = new Date(cert.issuedAt || cert.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const bottomY = doc.page.height - 110;

    doc.fillColor('#334155').fontSize(10);
    doc.text(`Issued Date: ${issuedDate}`, 60, bottomY);
    doc.text(`Certificate Code: ${cert.certificateCode}`, 60, bottomY + 16);

    doc.text(`Audit Verification URL:`, doc.page.width - 320, bottomY, { align: 'right' });
    doc.text(`https://lms-bpo.com/api/certificates/verify/${cert.certificateCode}`, doc.page.width - 320, bottomY + 16, { align: 'right' });

    doc.end();
  }
}
