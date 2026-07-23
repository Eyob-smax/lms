'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

// 1. Fetch Course Catalog Query
export function useCourseCatalog(params?: { category?: string; difficulty?: string; search?: string }) {
  return useQuery({
    queryKey: ['courses-catalog', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category && params.category !== 'ALL') searchParams.append('category', params.category);
      if (params?.difficulty && params.difficulty !== 'ALL') searchParams.append('difficulty', params.difficulty);
      if (params?.search) searchParams.append('search', params.search);

      const res = await apiClient.get(`/courses/catalog?${searchParams.toString()}`);
      return res.data?.data || res.data || [];
    },
  });
}

// 2. Fetch User Enrollments Query
export function useMyCourses() {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await apiClient.get('/enrollments/my-courses');
      return res.data || [];
    },
  });
}

// 3. Self-Enroll Mutation
export function useEnrollCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const userStr = localStorage.getItem('lms_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('User not authenticated');

      const res = await apiClient.post('/enrollments/assign', {
        courseId,
        userIds: [user.id],
      });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate queries to auto-refresh catalog and my-courses
      queryClient.invalidateQueries({ queryKey: ['courses-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
    },
  });
}

// 4. Fetch Certificates Query
export function useMyCertificates() {
  return useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await apiClient.get('/certificates/my-certificates');
      return res.data || [];
    },
  });
}

// 5. Request Certificate Mutation
export function useRequestCertificateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const res = await apiClient.post('/certificates/request', { enrollmentId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['pending-certificates'] });
    },
  });
}

// 6. Fetch Admin Analytics Overview Query
export function useAdminAnalyticsOverview() {
  return useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/overview');
      return res.data;
    },
  });
}
