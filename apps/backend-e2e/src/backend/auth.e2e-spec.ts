import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../backend/src/app/app.module';
import { PrismaService } from '../../../backend/src/prisma/prisma.service';

describe('Auth Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
      await prisma.user.deleteMany({
        where: { email: { in: ['e2e.admin@bpo.com', 'e2e.sdr@bpo.com'] } },
      });
    }
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register an admin user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'e2e.admin@bpo.com',
          name: 'E2E Admin',
          password: 'password123',
          role: 'ADMIN',
          department: 'Management',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toMatchObject({
        email: 'e2e.admin@bpo.com',
        name: 'E2E Admin',
        role: 'ADMIN',
        department: 'Management',
      });
    });

    it('should register an agent user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'e2e.sdr@bpo.com',
          name: 'E2E SDR Agent',
          password: 'password123',
          role: 'AGENT',
          department: 'SDR',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.role).toBe('AGENT');
    });

    it('should fail with 409 Conflict if email is already taken', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'e2e.admin@bpo.com',
          name: 'Duplicate Admin',
          password: 'password123',
          role: 'ADMIN',
          department: 'Management',
        })
        .expect(409);
    });

    it('should fail with 400 Bad Request on invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email-format',
          name: 'Test',
          password: 'password123',
          role: 'AGENT',
          department: 'Sales',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2e.admin@bpo.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('e2e.admin@bpo.com');
    });

    it('should fail with 401 Unauthorized for incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2e.admin@bpo.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let agentToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'e2e.sdr@bpo.com',
          password: 'password123',
        });
      agentToken = loginRes.body.accessToken;
    });

    it('should return 401 Unauthorized if no Bearer token provided', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return authenticated user profile when valid Bearer token provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.email).toBe('e2e.sdr@bpo.com');
      expect(response.body.role).toBe('AGENT');
      expect(response.body.department).toBe('SDR');
    });
  });
});
