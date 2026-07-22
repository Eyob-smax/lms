import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics & Reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get Admin Overview Dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Admin platform metrics and trends' })
  @Roles(Role.ADMIN)
  @Get('overview')
  getAdminOverview(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getAdminOverview(query);
  }

  @ApiOperation({ summary: 'Get Learner Personal Performance metrics' })
  @ApiResponse({ status: 200, description: 'Personal learning stats, skills, quiz trends' })
  @Get('learner')
  getLearnerPerformance(@CurrentUser('id') userId: string) {
    return this.analyticsService.getLearnerPerformance(userId);
  }

  @ApiOperation({ summary: 'Get Agent Leaderboard' })
  @ApiResponse({ status: 200, description: 'Top performing learners ranking' })
  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: number) {
    return this.analyticsService.getLeaderboard(limit ? Number(limit) : 10);
  }

  @ApiOperation({ summary: 'Export platform training completion report' })
  @ApiResponse({ status: 200, description: 'Structured JSON/CSV report data' })
  @Roles(Role.ADMIN)
  @Get('export')
  exportReport(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.exportReport(query);
  }
}
