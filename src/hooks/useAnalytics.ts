import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';

export function useAnalyticsOverview(params?: object) {
  return useQuery({
    queryKey: ['analytics', 'overview', params],
    queryFn: async () => {
      const res = await analyticsApi.getOverview(params);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBookingTrend(params?: object) {
  return useQuery({
    queryKey: ['analytics', 'trend', params],
    queryFn: async () => {
      const res = await analyticsApi.getBookingTrend(params);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaffPerformance() {
  return useQuery({
    queryKey: ['analytics', 'staff'],
    queryFn: async () => {
      const res = await analyticsApi.getStaffPerformance();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
