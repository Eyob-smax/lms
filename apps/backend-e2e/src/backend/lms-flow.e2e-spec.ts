import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../backend/src/app/app.module';
import { PrismaService } from '../../../backend/src/prisma/prisma.service';

describe('Full LMS End-to-End Workflow Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let adminUserId: string;
  let agentToken: string;
  let agentUserId: string;

  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let quizId: string;
  let questionId: string;
  let optionCorrectId: string;
  let optionWrongId: string;

  let enrollmentId: string;
  let attemptId: string;
  let certificateId: string;
  let certificateCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (prisma) {
      // Clean up test data
      await prisma.user.deleteMany({
        where: { email: { in: ['e2e.flow.admin@bpo.com', 'e2e.flow.sdr@bpo.com'] } },
      });
    }
    await app.close();
  });

  describe('1. Authentication & Registration Workflow', () => {
    it('Admin registers account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'e2e.flow.admin@bpo.com',
          name: 'Flow Admin',
          password: 'password123',
          role: 'ADMIN',
          department: 'Management',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      adminToken = res.body.accessToken;
      adminUserId = res.body.user.id;
    });

    it('SDR Agent registers account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'e2e.flow.sdr@bpo.com',
          name: 'Flow SDR Agent',
          password: 'password123',
          role: 'AGENT',
          department: 'SDR',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      agentToken = res.body.accessToken;
      agentUserId = res.body.user.id;
    });
  });

  describe('2. Course & Assessment Authoring Workflow', () => {
    it('Admin creates a new course', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Cold Calling & Prospecting Masterclass',
          description: 'Standard operating procedures for outbound SDR call scripts and objection handling.',
          category: 'Sales',
          department: 'SDR',
          difficulty: 'Intermediate',
          durationMinutes: 45,
          tags: ['SDR', 'Outbound', 'ColdCall'],
          isMandatory: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.courseCode).toMatch(/^CRS-\d{4}-\d{3}$/);
      expect(res.body.status).toBe('DRAFT');
      courseId = res.body.id;
    });

    it('Admin creates a module in the course', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons/modules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId,
          title: 'Module 1: High-Converting Call Scripts',
          description: 'Frameworks for openers, hook statements, and objection navigation.',
          order: 1,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      moduleId = res.body.id;
    });

    it('Admin creates a rich markdown lesson', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          moduleId,
          title: 'Lesson 1: Overcoming "Send Me an Email" Objection',
          description: 'Step-by-step objection handling framework.',
          lessonType: 'TEXT',
          content: '## Overcoming Objections\n\nWhen a prospect says "send me an email":\n\n1. **Acknowledge:** "I would be happy to do that."\n2. **Clarify:** "To make sure I send what is relevant, are you focused on X or Y?"\n3. **Close:** "Let us spend 2 minutes now."',
          durationMinutes: 15,
          order: 1,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      lessonId = res.body.id;
    });

    it('Admin creates a quiz for the course', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId,
          title: 'Objection Handling Assessment',
          passingScorePct: 80,
          maxAttempts: 3,
          timeLimitMinutes: 10,
          randomize: true,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      quizId = res.body.id;
    });

    it('Admin adds a question to the quiz', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/quizzes/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizId,
          questionText: 'What is the first step when a prospect requests an email?',
          questionType: 'MCQ',
          explanation: 'Always acknowledge the request first before clarifying target interest.',
          points: 1,
          order: 1,
          options: [
            { optionText: 'Acknowledge the request politely', isCorrect: true },
            { optionText: 'Hang up immediately', isCorrect: false },
            { optionText: 'Argue with the prospect', isCorrect: false },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      questionId = res.body.id;
      const correctOpt = res.body.options.find((o: any) => o.isCorrect);
      const wrongOpt = res.body.options.find((o: any) => !o.isCorrect);
      optionCorrectId = correctOpt.id;
      optionWrongId = wrongOpt.id;
    });

    it('Admin publishes the course', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/courses/${courseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.version).toBe(2);
    });
  });

  describe('3. AI Course Authoring Workflow', () => {
    it('Admin generates a full draft course package via AI', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/draft-course')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topic: 'Data Security Protocols',
          targetRole: 'SDR',
          objective: 'Ensure PII compliance',
          difficulty: 'Intermediate',
          includeQuiz: true,
        })
        .expect(201);

      expect(res.body.status).toBe('DRAFT');
      expect(res.body.modules.length).toBeGreaterThan(0);
      expect(res.body.quizzes.length).toBeGreaterThan(0);
    });
  });

  describe('4. Batch Cohort Course Assignment', () => {
    it('Admin batch assigns course to SDR cohort', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/enrollments/assign-cohort')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId,
          department: 'SDR',
          cohortName: 'SDR Q3 Onboarding Cohort',
          dueDate: '2026-12-31T23:59:59.000Z',
          isMandatory: true,
        })
        .expect(201);

      expect(res.body.assignedCount).toBeGreaterThan(0);
      expect(res.body.cohortSummary.department).toBe('SDR');

      const userEnrollment = res.body.enrollments.find((e: any) => e.userId === agentUserId);
      expect(userEnrollment).toBeDefined();
      enrollmentId = userEnrollment.id;
    });
  });

  describe('5. Learner Execution & Quiz Attempt', () => {
    it('Agent views my-courses catalog', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/enrollments/my-courses')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const myCourse = res.body.find((e: any) => e.courseId === courseId);
      expect(myCourse).toBeDefined();
    });

    it('Agent marks lesson as complete', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/enrollments/mark-lesson')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          enrollmentId,
          lessonId,
        })
        .expect(201);

      expect(res.body.overallProgressPct).toBe(100);
      expect(res.body.status).toBe('COMPLETED');
    });

    it('Agent submits quiz attempt with correct answer', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          enrollmentId,
          answers: [{ questionId, selectedOptionId: optionCorrectId }],
        })
        .expect(201);

      expect(res.body.scorePct).toBe(100);
      expect(res.body.isPassed).toBe(true);
      attemptId = res.body.attemptId;
    });

    it('Learner views detailed quiz attempt drill-down & missed questions analysis', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/quizzes/attempts/${attemptId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(res.body.attemptId).toBe(attemptId);
      expect(res.body.scorePct).toBe(100);
      expect(res.body.questionsBreakdown.length).toBe(1);
      expect(res.body.questionsBreakdown[0].isCorrect).toBe(true);
    });
  });

  describe('6. Certificate Request, Admin Approval & Dynamic PDF Streaming', () => {
    it('Learner requests a certificate for completed course', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/certificates/request')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ enrollmentId })
        .expect(201);

      expect(res.body.certificate.status).toBe('REQUESTED');
      certificateId = res.body.certificate.id;
      certificateCode = res.body.certificate.certificateCode;
    });

    it('Admin views pending certificate requests', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/certificates/requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const pendingReq = res.body.find((c: any) => c.id === certificateId);
      expect(pendingReq).toBeDefined();
    });

    it('Admin approves certificate request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/certificates/${certificateId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.status).toBe('APPROVED');
      expect(res.body.approvedBy).toBe(adminUserId);
    });

    it('Public endpoint verifies certificate code without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/certificates/verify/${certificateCode}`)
        .expect(200);

      expect(res.body.valid).toBe(true);
      expect(res.body.certificateCode).toBe(certificateCode);
      expect(res.body.student.name).toBe('Flow SDR Agent');
      expect(res.body.course.title).toBe('Cold Calling & Prospecting Masterclass');
    });

    it('User downloads PDF certificate stream', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/certificates/${certificateId}/pdf`)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('7. Analytics & Executive Reporting', () => {
    it('Admin views overview dashboard metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.overview.totalUsers).toBeGreaterThan(0);
      expect(res.body.overview.activeCourses).toBeGreaterThan(0);
      expect(res.body.departmentPerformance).toBeDefined();
    });

    it('Admin exports platform report dataset', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.totalRecords).toBeGreaterThan(0);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
