import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'super-secret-better-auth-key-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'https://lms.wearecerta.app',
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || 'mock-github-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock-github-client-secret',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'AGENT',
      },
      department: {
        type: 'string',
        defaultValue: 'Sales',
      },
    },
  },
});
