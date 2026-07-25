import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://lms.wearecerta.app',
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
