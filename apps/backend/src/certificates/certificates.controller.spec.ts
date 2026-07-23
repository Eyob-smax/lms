import { Test, TestingModule } from '@nestjs/testing';
import { CertificateStatus } from '@prisma/client';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

describe('CertificatesController', () => {
  let controller: CertificatesController;
  let service: CertificatesService;

  const mockCertificatesService = {
    requestCertificate: jest.fn(),
    getUserCertificates: jest.fn(),
    getPendingRequests: jest.fn(),
    approveCertificate: jest.fn(),
    rejectCertificate: jest.fn(),
    verifyCertificate: jest.fn(),
    generatePdfStream: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificatesController],
      providers: [{ provide: CertificatesService, useValue: mockCertificatesService }],
    }).compile();

    controller = module.get<CertificatesController>(CertificatesController);
    service = module.get<CertificatesService>(CertificatesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requestCertificate', async () => {
    mockCertificatesService.requestCertificate.mockResolvedValue({ message: 'Requested' });
    const dto = { enrollmentId: 'enr-1' };
    const res = await controller.requestCertificate(dto, 'u-1');
    expect(res).toEqual({ message: 'Requested' });
    expect(mockCertificatesService.requestCertificate).toHaveBeenCalledWith(dto, 'u-1');
  });

  it('getPendingRequests', async () => {
    mockCertificatesService.getPendingRequests.mockResolvedValue([]);
    const res = await controller.getPendingRequests();
    expect(res).toEqual([]);
    expect(mockCertificatesService.getPendingRequests).toHaveBeenCalled();
  });

  it('approveCertificate', async () => {
    mockCertificatesService.approveCertificate.mockResolvedValue({ id: 'cert-1', status: CertificateStatus.APPROVED });
    const res = await controller.approveCertificate('cert-1', 'admin-1');
    expect(res.status).toBe(CertificateStatus.APPROVED);
    expect(mockCertificatesService.approveCertificate).toHaveBeenCalledWith('cert-1', 'admin-1');
  });

  it('verifyCertificate', async () => {
    mockCertificatesService.verifyCertificate.mockResolvedValue({ valid: true, certificateCode: 'CERT-123' });
    const res = await controller.verifyCertificate('CERT-123');
    expect(res.valid).toBe(true);
    expect(mockCertificatesService.verifyCertificate).toHaveBeenCalledWith('CERT-123');
  });
});
