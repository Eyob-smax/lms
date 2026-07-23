import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CertificateStatus, EnrollmentStatus } from '@prisma/client';
import { CertificatesService } from './certificates.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    enrollment: {
      findUnique: jest.fn(),
    },
    certificate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = moduleFixture.get<CertificatesService>(CertificatesService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestCertificate()', () => {
    it('should submit certificate request when course is completed', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-1',
        userId: 'u-1',
        status: EnrollmentStatus.COMPLETED,
        overallProgressPct: 100,
        user: { name: 'Jane Doe', email: 'jane@bpo.com', department: 'Sales' },
        course: { title: 'Sales 101', courseCode: 'CRS-2024-001' },
      });
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);
      mockPrismaService.certificate.create.mockResolvedValue({
        id: 'cert-1',
        enrollmentId: 'enr-1',
        status: CertificateStatus.REQUESTED,
        certificateCode: 'CERT-2026-ABC12',
      });

      const res = await service.requestCertificate({ enrollmentId: 'enr-1' }, 'u-1');

      expect(res.certificate.status).toBe(CertificateStatus.REQUESTED);
      expect(mockPrismaService.certificate.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if course is incomplete', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-1',
        userId: 'u-1',
        status: EnrollmentStatus.IN_PROGRESS,
        overallProgressPct: 50,
      });

      await expect(service.requestCertificate({ enrollmentId: 'enr-1' }, 'u-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveCertificate()', () => {
    it('should approve and issue pending certificate request', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        status: CertificateStatus.REQUESTED,
      });
      mockPrismaService.certificate.update.mockResolvedValue({
        id: 'cert-1',
        status: CertificateStatus.APPROVED,
        approvedBy: 'admin-1',
      });

      const res = await service.approveCertificate('cert-1', 'admin-1');

      expect(res.status).toBe(CertificateStatus.APPROVED);
      expect(res.approvedBy).toBe('admin-1');
    });
  });

  describe('verifyCertificate()', () => {
    it('should return audit payload for valid approved certificate code', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue({
        id: 'cert-1',
        certificateCode: 'CERT-2026-ABC12',
        status: CertificateStatus.APPROVED,
        issuedAt: new Date(),
        enrollment: {
          finalScorePct: 95,
          user: { name: 'Jane Agent', email: 'jane@bpo.com', department: 'Sales' },
          course: { id: 'c-1', title: 'Sales Masterclass', courseCode: 'CRS-2024-001', category: 'Sales' },
        },
      });

      const res = await service.verifyCertificate('CERT-2026-ABC12');

      expect(res.valid).toBe(true);
      expect(res.student.name).toBe('Jane Agent');
      expect(res.course.courseCode).toBe('CRS-2024-001');
    });

    it('should throw NotFoundException for invalid or non-approved certificate code', async () => {
      mockPrismaService.certificate.findUnique.mockResolvedValue(null);

      await expect(service.verifyCertificate('INVALID-CODE')).rejects.toThrow(NotFoundException);
    });
  });
});
