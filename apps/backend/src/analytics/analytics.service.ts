import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminOverview(query: QueryAnalyticsDto) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Total Users & Trend
    const totalUsers = await this.prisma.user.count();
    const usersLastMonth = await this.prisma.user.count({
      where: { createdAt: { lte: thirtyDaysAgo } },
    });
    const usersTrendPct = usersLastMonth > 0
      ? Number((((totalUsers - usersLastMonth) / usersLastMonth) * 100).toFixed(1))
      : 0;

    // 2. Active Courses & New Added This Week
    const activeCourses = await this.prisma.course.count({
      where: { status: 'PUBLISHED' },
    });
    const newCoursesThisWeek = await this.prisma.course.count({
      where: {
        status: 'PUBLISHED',
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // 3. Completion Rate & Trend
    const totalEnrollments = await this.prisma.enrollment.count();
    const completedEnrollments = await this.prisma.enrollment.count({
      where: { status: 'COMPLETED' },
    });
    const completionRatePct = totalEnrollments > 0
      ? Number(((completedEnrollments / totalEnrollments) * 100).toFixed(1))
      : 0;

    const completedLastMonth = await this.prisma.enrollment.count({
      where: { status: 'COMPLETED', completedAt: { lte: thirtyDaysAgo } },
    });
    const totalLastMonth = await this.prisma.enrollment.count({
      where: { createdAt: { lte: thirtyDaysAgo } },
    });
    const prevCompletionRatePct = totalLastMonth > 0
      ? (completedLastMonth / totalLastMonth) * 100
      : 0;
    const completionRateTrendPct = Number((completionRatePct - prevCompletionRatePct).toFixed(1));

    // 4. Learning Progress Timeline (Weekly completions over last 6 weeks)
    const learningProgressTimeline = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const count = await this.prisma.enrollment.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: weekStart, lte: weekEnd },
        },
      });

      learningProgressTimeline.push({
        label: `Week ${6 - i}`,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        completions: count,
      });
    }

    // 5. Department Performance
    const departments = ['Sales', 'Customer Support', 'Engineering', 'Marketing', 'HR'];
    const departmentPerformance = await Promise.all(
      departments.map(async (dept) => {
        const deptUsers = await this.prisma.user.findMany({
          where: { department: dept },
          select: { id: true },
        });
        const userIds = deptUsers.map((u) => u.id);

        const deptTotal = await this.prisma.enrollment.count({
          where: { userId: { in: userIds } },
        });
        const deptCompleted = await this.prisma.enrollment.count({
          where: { userId: { in: userIds }, status: 'COMPLETED' },
        });

        const rate = deptTotal > 0 ? Number(((deptCompleted / deptTotal) * 100).toFixed(1)) : 0;

        return {
          department: dept,
          totalEnrollments: deptTotal,
          completedEnrollments: deptCompleted,
          completionRatePct: rate,
        };
      }),
    );

    // 6. Critical Course Status (Compliance / Mandatory courses)
    const criticalCoursesList = await this.prisma.course.findMany({
      where: { isMandatory: true, status: 'PUBLISHED' },
      take: 5,
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    const criticalCourses = await Promise.all(
      criticalCoursesList.map(async (course) => {
        const total = course._count.enrollments;
        const completed = await this.prisma.enrollment.count({
          where: { courseId: course.id, status: 'COMPLETED' },
        });
        const rate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

        return {
          id: course.id,
          title: course.title,
          courseCode: course.courseCode,
          completionRatePct: rate,
          totalEnrolled: total,
          isActionRequired: rate < 50,
        };
      }),
    );

    // 7. Recent Activity Feed
    const recentEnrollments = await this.prisma.enrollment.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { name: true, image: true, department: true } },
        course: { select: { title: true } },
      },
    });

    const recentActivity = recentEnrollments.map((e) => {
      let type: 'COMPLETED' | 'ENROLLED' | 'IN_PROGRESS' = 'ENROLLED';
      let message = `${e.user.name} enrolled in ${e.course.title}`;

      if (e.status === 'COMPLETED') {
        type = 'COMPLETED';
        message = `${e.user.name} completed ${e.course.title}`;
      } else if (e.status === 'IN_PROGRESS') {
        type = 'IN_PROGRESS';
        message = `${e.user.name} started ${e.course.title}`;
      }

      return {
        id: e.id,
        userName: e.user.name,
        userImage: e.user.image,
        department: e.user.department,
        courseTitle: e.course.title,
        type,
        message,
        timestamp: e.updatedAt,
      };
    });

    return {
      overview: {
        totalUsers,
        totalUsersTrendPct: usersTrendPct,
        activeCourses,
        newCoursesThisWeek,
        completionRatePct,
        completionRateTrendPct,
      },
      learningProgressTimeline,
      departmentPerformance,
      criticalCourses,
      recentActivity,
    };
  }

  async getLearnerPerformance(userId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Weekly Learning Hours
    const completedProgress = await this.prisma.lessonProgress.findMany({
      where: {
        enrollment: { userId },
        isCompleted: true,
        completedAt: { gte: sevenDaysAgo },
      },
      include: {
        lesson: { select: { durationMinutes: true } },
      },
    });

    const totalMinutes = completedProgress.reduce((sum, p) => sum + (p.lesson.durationMinutes || 10), 0);
    const weeklyLearningHours = Number((totalMinutes / 60).toFixed(1));

    // 2. Average Quiz Score
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: { enrollment: { userId } },
      select: { scorePct: true, completedAt: true },
    });

    const avgQuizScore = quizAttempts.length > 0
      ? Number((quizAttempts.reduce((sum, q) => sum + q.scorePct, 0) / quizAttempts.length).toFixed(1))
      : 0;

    // 3. Skills Acquired in Last 30 Days
    const completedEnrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: thirtyDaysAgo },
      },
      include: {
        course: { select: { category: true, tags: true } },
      },
    });

    const skillsSet = new Set<string>();
    completedEnrollments.forEach((e) => {
      if (e.course.category) skillsSet.add(e.course.category);
      e.course.tags.forEach((tag) => skillsSet.add(tag));
    });

    const skillsAcquiredCount = skillsSet.size;

    // 4. Monthly Quiz Score Trends (Last 6 Months)
    const quizScoreTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const attempts = await this.prisma.quizAttempt.findMany({
        where: {
          enrollment: { userId },
          startedAt: { gte: monthStart, lte: monthEnd },
        },
        select: { scorePct: true },
      });

      const avgScore = attempts.length > 0
        ? Number((attempts.reduce((sum, a) => sum + a.scorePct, 0) / attempts.length).toFixed(1))
        : 0;

      const monthName = monthStart.toLocaleString('default', { month: 'short' });

      quizScoreTrends.push({
        month: monthName,
        avgScore,
        attemptsCount: attempts.length,
      });
    }

    // 5. Top Skills
    const allCompletedCourses = await this.prisma.enrollment.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        course: { select: { category: true, tags: true } },
      },
    });

    const skillCounts: Record<string, number> = {};
    allCompletedCourses.forEach((e) => {
      const skillName = e.course.category;
      if (skillName) {
        skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
      }
    });

    const topSkills = Object.entries(skillCounts).map(([skill, count]) => ({
      skill,
      count,
    }));

    // 6. Recent Personal Activity
    const personalEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        course: { select: { title: true } },
      },
    });

    const recentActivity = personalEnrollments.map((e) => ({
      id: e.id,
      courseTitle: e.course.title,
      status: e.status,
      overallProgressPct: e.overallProgressPct,
      updatedAt: e.updatedAt,
    }));

    // 7. Assigned Training & Upcoming Deadlines
    const activeEnrollments = await this.prisma.enrollment.findMany({
      where: { userId, status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } },
      include: {
        course: { select: { title: true, category: true, durationMinutes: true, thumbnailUrl: true } },
      },
    });

    const upcomingDeadlines = activeEnrollments
      .filter((e) => e.dueDate)
      .map((e) => ({
        id: e.id,
        courseTitle: e.course.title,
        dueDate: e.dueDate,
        isMandatory: e.isMandatory,
        progressPct: e.overallProgressPct,
      }));

    return {
      summary: {
        weeklyLearningHours,
        avgQuizScore,
        skillsAcquiredCount,
      },
      quizScoreTrends,
      topSkills,
      recentActivity,
      assignedTraining: activeEnrollments,
      upcomingDeadlines,
    };
  }

  async getLeaderboard(limit = 10) {
    const agents = await this.prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        image: true,
        enrollments: {
          select: {
            status: true,
            finalScorePct: true,
          },
        },
      },
    });

    const leaderboard = agents.map((agent) => {
      const completedCount = agent.enrollments.filter((e) => e.status === 'COMPLETED').length;
      const scores = agent.enrollments.map((e) => e.finalScorePct).filter((s): s is number => s !== null && s !== undefined);
      const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        department: agent.department,
        image: agent.image,
        completedCoursesCount: completedCount,
        averageScorePct: avgScore,
        scorePoints: completedCount * 100 + Math.round(avgScore * 10),
      };
    });

    leaderboard.sort((a, b) => b.scorePoints - a.scorePoints);

    return leaderboard.slice(0, limit);
  }

  async exportReport(query: QueryAnalyticsDto) {
    const enrollments = await this.prisma.enrollment.findMany({
      include: {
        user: { select: { name: true, email: true, department: true } },
        course: { select: { courseCode: true, title: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reportData = enrollments.map((e) => ({
      userName: e.user.name,
      userEmail: e.user.email,
      department: e.user.department,
      courseCode: e.course.courseCode,
      courseTitle: e.course.title,
      category: e.course.category,
      status: e.status,
      progressPct: e.overallProgressPct,
      finalScorePct: e.finalScorePct ?? 'N/A',
      enrolledAt: e.createdAt,
      completedAt: e.completedAt ?? 'N/A',
    }));

    return {
      exportedAt: new Date().toISOString(),
      totalRecords: reportData.length,
      data: reportData,
    };
  }
}
