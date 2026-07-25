/// <reference types="node" />
import { PrismaClient, Role, CourseStatus, LessonType, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for @lms Enterprise...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // --- 1. SEED ADMIN USERS (2 Admins + Legacy Admin) ---
  console.log('👤 Seeding Admin accounts...');
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@wearecerta.app' },
    update: { name: 'Training Admin Lead', role: Role.ADMIN, department: 'Management' },
    create: {
      email: 'admin@wearecerta.app',
      name: 'Training Admin Lead',
      passwordHash,
      role: Role.ADMIN,
      department: 'Management',
      emailVerified: true,
      isActive: true,
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'ops.admin@wearecerta.app' },
    update: { name: 'Operations Admin Director', role: Role.ADMIN, department: 'Operations' },
    create: {
      email: 'ops.admin@wearecerta.app',
      name: 'Operations Admin Director',
      passwordHash,
      role: Role.ADMIN,
      department: 'Operations',
      emailVerified: true,
      isActive: true,
    },
  });

  // Legacy compatibility admin
  await prisma.user.upsert({
    where: { email: 'admin@bpo.com' },
    update: { role: Role.ADMIN },
    create: {
      email: 'admin@bpo.com',
      name: 'Legacy Admin',
      passwordHash,
      role: Role.ADMIN,
      department: 'Management',
      emailVerified: true,
    },
  });

  // --- 2. SEED 10 AGENT USERS ---
  console.log('👥 Seeding 10 BPO Agent accounts...');
  const agentsData = [
    { email: 'sdr.agent@wearecerta.app', name: 'Sarah Jenkins', department: 'SDR' },
    { email: 'sales.agent1@wearecerta.app', name: 'Marcus Vance', department: 'Sales' },
    { email: 'sales.agent2@wearecerta.app', name: 'Elena Rostova', department: 'Sales' },
    { email: 'bdr.agent@wearecerta.app', name: 'Brian Sterling', department: 'BDR' },
    { email: 'support.agent1@wearecerta.app', name: 'David Kim', department: 'Customer Support' },
    { email: 'support.agent2@wearecerta.app', name: 'Chloe Bennett', department: 'Customer Support' },
    { email: 'tele.agent@wearecerta.app', name: 'Taylor Brooks', department: 'Telemarketing' },
    { email: 'it.agent1@wearecerta.app', name: 'Ian Malcolm', department: 'IT' },
    { email: 'it.agent2@wearecerta.app', name: 'Travis Scott', department: 'IT' },
    { email: 'hr.agent@wearecerta.app', name: 'Hannah Abbott', department: 'HR' },
  ];

  const createdAgents = [];
  for (const agent of agentsData) {
    const user = await prisma.user.upsert({
      where: { email: agent.email },
      update: { name: agent.name, department: agent.department, role: Role.AGENT, isActive: true },
      create: {
        email: agent.email,
        name: agent.name,
        passwordHash,
        role: Role.AGENT,
        department: agent.department,
        emailVerified: true,
        isActive: true,
      },
    });
    createdAgents.push(user);
  }

  // Legacy compatibility agents
  await prisma.user.upsert({ where: { email: 'sdr.agent@bpo.com' }, update: {}, create: { email: 'sdr.agent@bpo.com', name: 'Sarah SDR', passwordHash, role: Role.AGENT, department: 'SDR' } });
  await prisma.user.upsert({ where: { email: 'it.agent@bpo.com' }, update: {}, create: { email: 'it.agent@bpo.com', name: 'Ian IT', passwordHash, role: Role.AGENT, department: 'IT' } });
  await prisma.user.upsert({ where: { email: 'hr.agent@bpo.com' }, update: {}, create: { email: 'hr.agent@bpo.com', name: 'Hannah HR', passwordHash, role: Role.AGENT, department: 'HR' } });

  // --- 3. SEED COURSES & MODULES ---
  console.log('📚 Seeding BPO Training Courses...');
  const course1 = await prisma.course.upsert({
    where: { courseCode: 'CRS-2026-001' },
    update: { title: 'BPO Core Compliance & Data Security 2026', status: CourseStatus.PUBLISHED },
    create: {
      courseCode: 'CRS-2026-001',
      title: 'BPO Core Compliance & Data Security 2026',
      description: 'Mandatory annual training covering ISO 27001 data privacy standards, PII protection, clean desk protocols, and cybersecurity hygiene for BPO operations.',
      category: 'Compliance',
      difficulty: 'Beginner',
      durationMinutes: 45,
      isMandatory: true,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      createdById: admin1.id,
      tags: ['compliance', 'security', 'iso27001', 'mandatory'],
    },
  });

  const module1 = await prisma.module.upsert({
    where: { id: 'mod-sec-01' },
    update: { title: 'Introduction to BPO Security Standards' },
    create: {
      id: 'mod-sec-01',
      courseId: course1.id,
      title: 'Introduction to BPO Security Standards',
      description: 'Fundamentals of safeguarding client data in a contact center environment.',
      order: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'les-sec-01' },
    update: { title: 'Clean Desk & Clear Screen Protocols' },
    create: {
      id: 'les-sec-01',
      moduleId: module1.id,
      title: 'Clean Desk & Clear Screen Protocols',
      description: 'Understanding physical and workstations security rules on the operating floor.',
      lessonType: LessonType.TEXT,
      content: '# Clean Desk Policy\n\nAll employees must ensure that sensitive customer data is never left unattended on desks or visible on unsecured computer monitors.\n\n### Key Rules:\n1. **Lock Your Workstation**: Always press `Win + L` or `Ctrl + Cmd + Q` before stepping away.\n2. **No Physical Notes**: Do not write customer credit card numbers or PII on paper.\n3. **Restricted Devices**: Personal mobile phones must be stored in designated lockers before entering the production floor.',
      durationMinutes: 15,
      order: 1,
      isPublished: true,
    },
  });

  const quiz1 = await prisma.quiz.upsert({
    where: { id: 'quiz-sec-01' },
    update: { title: 'Data Security Certification Quiz' },
    create: {
      id: 'quiz-sec-01',
      courseId: course1.id,
      title: 'Data Security Certification Quiz',
      passingScorePct: 80,
      maxAttempts: 3,
      timeLimitMinutes: 15,
      randomize: true,
    },
  });

  const q1 = await prisma.quizQuestion.upsert({
    where: { id: 'q-sec-01' },
    update: { questionText: 'What should you immediately do before leaving your workstation?' },
    create: {
      id: 'q-sec-01',
      quizId: quiz1.id,
      questionText: 'What should you immediately do before leaving your workstation?',
      questionType: QuestionType.MCQ,
      explanation: 'Locking your screen prevents unauthorized access to customer records.',
      points: 10,
      order: 1,
    },
  });

  await prisma.quizOption.upsert({
    where: { id: 'opt-sec-01a' },
    update: {},
    create: { id: 'opt-sec-01a', questionId: q1.id, optionText: 'Lock your computer screen (Win + L)', isCorrect: true },
  });
  await prisma.quizOption.upsert({
    where: { id: 'opt-sec-01b' },
    update: {},
    create: { id: 'opt-sec-01b', questionId: q1.id, optionText: 'Turn off the monitor only', isCorrect: false },
  });

  const course2 = await prisma.course.upsert({
    where: { courseCode: 'CRS-2026-002' },
    update: { title: 'Outbound Sales Mastery & Objection Handling', status: CourseStatus.PUBLISHED },
    create: {
      courseCode: 'CRS-2026-002',
      title: 'Outbound Sales Mastery & Objection Handling',
      description: 'Advanced techniques for prospecting, overcoming gatekeepers, and closing high-value BPO client contracts.',
      category: 'Sales',
      department: 'Sales',
      difficulty: 'Intermediate',
      durationMinutes: 60,
      isMandatory: false,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      createdById: admin2.id,
      tags: ['sales', 'outbound', 'prospecting', 'objection-handling'],
    },
  });

  // --- 4. SEED ENROLLMENTS ---
  console.log('🎓 Enrolling Agents into Courses...');
  for (const agent of createdAgents) {
    // Enroll all agents in the mandatory compliance course
    await prisma.enrollment.upsert({
      where: {
        id: `enroll-${agent.id}-${course1.id}`,
      },
      update: {},
      create: {
        id: `enroll-${agent.id}-${course1.id}`,
        userId: agent.id,
        courseId: course1.id,
        assignedBy: admin1.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        isMandatory: true,
      },
    }).catch(() => {}); // ignore duplicate ID errors if uuid used

    // Enroll sales agents into Sales course
    if (agent.department === 'Sales' || agent.department === 'SDR' || agent.department === 'BDR') {
      await prisma.enrollment.upsert({
        where: {
          id: `enroll-${agent.id}-${course2.id}`,
        },
        update: {},
        create: {
          id: `enroll-${agent.id}-${course2.id}`,
          userId: agent.id,
          courseId: course2.id,
          assignedBy: admin2.id,
          isMandatory: false,
        },
      }).catch(() => {});
    }
  }

  // --- 5. OUTPUT CREDENTIALS TABLE ---
  console.log('\n================================================================================');
  console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨');
  console.log('================================================================================\n');
  console.log('🔑 ADMIN CREDENTIALS (Password for all: password123)');
  console.log('--------------------------------------------------------------------------------');
  console.log(' 1. Training Admin Lead    | admin@wearecerta.app     | Role: ADMIN | Dept: Management');
  console.log(' 2. Operations Director    | ops.admin@wearecerta.app | Role: ADMIN | Dept: Operations');
  console.log(' 3. Legacy Admin (Alias)   | admin@bpo.com            | Role: ADMIN | Dept: Management');
  console.log('--------------------------------------------------------------------------------\n');
  console.log('👥 AGENT CREDENTIALS (Password for all: password123)');
  console.log('--------------------------------------------------------------------------------');
  console.log(' 1. Sarah Jenkins          | sdr.agent@wearecerta.app     | Role: AGENT | Dept: SDR');
  console.log(' 2. Marcus Vance           | sales.agent1@wearecerta.app  | Role: AGENT | Dept: Sales');
  console.log(' 3. Elena Rostova          | sales.agent2@wearecerta.app  | Role: AGENT | Dept: Sales');
  console.log(' 4. Brian Sterling         | bdr.agent@wearecerta.app     | Role: AGENT | Dept: BDR');
  console.log(' 5. David Kim              | support.agent1@wearecerta.app| Role: AGENT | Dept: Customer Support');
  console.log(' 6. Chloe Bennett          | support.agent2@wearecerta.app| Role: AGENT | Dept: Customer Support');
  console.log(' 7. Taylor Brooks          | tele.agent@wearecerta.app    | Role: AGENT | Dept: Telemarketing');
  console.log(' 8. Ian Malcolm            | it.agent1@wearecerta.app     | Role: AGENT | Dept: IT');
  console.log(' 9. Travis Scott           | it.agent2@wearecerta.app     | Role: AGENT | Dept: IT');
  console.log('10. Hannah Abbott          | hr.agent@wearecerta.app      | Role: AGENT | Dept: HR');
  console.log('--------------------------------------------------------------------------------');
  console.log('🌐 Login URL: https://lms.wearecerta.app/login');
  console.log('================================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
