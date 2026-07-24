/// <reference types="node" />
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bpo.com' },
    update: {},
    create: {
      email: 'admin@bpo.com',
      name: 'Training Admin Lead',
      passwordHash,
      role: Role.ADMIN,
      department: 'Management',
    },
  });

  const sdrAgent = await prisma.user.upsert({
    where: { email: 'sdr.agent@bpo.com' },
    update: {},
    create: {
      email: 'sdr.agent@bpo.com',
      name: 'Sarah SDR',
      passwordHash,
      role: Role.AGENT,
      department: 'SDR',
    },
  });

  const itAgent = await prisma.user.upsert({
    where: { email: 'it.agent@bpo.com' },
    update: {},
    create: {
      email: 'it.agent@bpo.com',
      name: 'Ian IT',
      passwordHash,
      role: Role.AGENT,
      department: 'IT',
    },
  });

  const hrAgent = await prisma.user.upsert({
    where: { email: 'hr.agent@bpo.com' },
    update: {},
    create: {
      email: 'hr.agent@bpo.com',
      name: 'Hannah HR',
      passwordHash,
      role: Role.AGENT,
      department: 'HR',
    },
  });

  console.log('✅ Seed users created:');
  console.log(` - Admin: ${admin.email} (password: password123)`);
  console.log(` - SDR Agent: ${sdrAgent.email} (password: password123)`);
  console.log(` - IT Agent: ${itAgent.email} (password: password123)`);
  console.log(` - HR Agent: ${hrAgent.email} (password: password123)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
