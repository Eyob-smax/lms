import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { RequestCertificateDto } from './dto/request-certificate.dto';
import { RejectCertificateDto } from './dto/reject-certificate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Certificates & Compliance')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @ApiOperation({ summary: 'Public Verification Endpoint for BPO client compliance audits' })
  @ApiResponse({ status: 200, description: 'Certificate validity status, student, course, and score details' })
  @Get('verify/:code')
  verifyCertificate(@Param('code') code: string) {
    return this.certificatesService.verifyCertificate(code);
  }

  @ApiOperation({ summary: 'Download / View dynamic PDF Certificate stream' })
  @ApiResponse({ status: 200, description: 'Application/pdf stream' })
  @Get(':id/pdf')
  async getCertificatePdf(@Param('id') id: string, @Res() res: Response) {
    return this.certificatesService.generatePdfStream(id, res);
  }

  @ApiOperation({ summary: 'Request certificate after completing course lessons & passing quiz' })
  @ApiResponse({ status: 201, description: 'Certificate request submitted for admin review' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('request')
  requestCertificate(@Body() dto: RequestCertificateDto, @CurrentUser('id') userId: string) {
    return this.certificatesService.requestCertificate(dto, userId);
  }

  @ApiOperation({ summary: 'Get current user requested and issued certificates' })
  @ApiResponse({ status: 200, description: 'List of learner certificates' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-certificates')
  getUserCertificates(@CurrentUser('id') userId: string) {
    return this.certificatesService.getUserCertificates(userId);
  }

  @ApiOperation({ summary: 'Get pending certificate requests for admin approval (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pending certificate requests' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('requests')
  getPendingRequests() {
    return this.certificatesService.getPendingRequests();
  }

  @ApiOperation({ summary: 'Get pending certificate requests for admin approval alias' })
  @ApiResponse({ status: 200, description: 'List of pending certificate requests' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('pending-requests')
  getPendingRequestsAlias() {
    return this.certificatesService.getPendingRequests();
  }

  @ApiOperation({ summary: 'Get all company certificates for admin management (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all certificates' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('all')
  getAllCertificates() {
    return this.certificatesService.getAllCertificates();
  }

  @ApiOperation({ summary: 'Approve and issue certificate (Admin only)' })
  @ApiResponse({ status: 200, description: 'Certificate approved and issued' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/approve')
  approveCertificate(@Param('id') id: string, @CurrentUser('id') adminUserId: string) {
    return this.certificatesService.approveCertificate(id, adminUserId);
  }

  @ApiOperation({ summary: 'Reject certificate request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Certificate request rejected' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/reject')
  rejectCertificate(@Param('id') id: string, @CurrentUser('id') adminUserId: string, @Body() dto: RejectCertificateDto) {
    return this.certificatesService.rejectCertificate(id, adminUserId, dto.rejectionReason);
  }
}
