import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '../services/api';
import toast from 'react-hot-toast';

export function useFleet(params?: object) {
  return useQuery({
    queryKey: ['fleet', params],
    queryFn: async () => {
      const res = await fleetApi.getAll(params);
      return res.data;
    },
  });
}

export function useTruck(id: string) {
  return useQuery({
    queryKey: ['truck', id],
    queryFn: async () => {
      const res = await fleetApi.getById(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => fleetApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fleet'] });
      toast.success('Truck added to fleet!');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to add truck');
    },
  });
}

export function useUpdateTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ truckId, data }: { truckId: string; data: object }) => fleetApi.update(truckId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['fleet'] });
      qc.invalidateQueries({ queryKey: ['truck', vars.truckId] });
      toast.success('Truck updated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update truck');
    },
  });
}
