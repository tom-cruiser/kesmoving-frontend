import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../services/api';
import toast from 'react-hot-toast';
import type { Booking } from '../types';

export function useBookings(params?: object) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const res = await bookingApi.getAll(params);
      return res.data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await bookingApi.getById(id);
      return res.data as { data: Booking };
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => bookingApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    },
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, status, note }: { bookingId: string; status: string; note?: string }) =>
      bookingApi.updateStatus(bookingId, { status, note }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking', vars.bookingId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update status');
    },
  });
}

export function useAssignCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, crewData }: { bookingId: string; crewData: object }) =>
      bookingApi.assignCrew(bookingId, crewData as { driverId: string; moverIds?: string[]; truckId: string }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking', vars.bookingId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to assign crew');
    },
  });
}

export function useUploadPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, formData }: { bookingId: string; formData: FormData }) =>
      bookingApi.uploadPhotos(bookingId, formData),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['booking', vars.bookingId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Upload failed');
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, cancellationReason }: { bookingId: string; cancellationReason?: string }) =>
      bookingApi.cancel(bookingId, { cancellationReason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking', vars.bookingId] });
      toast.success('Booking cancelled');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to cancel booking');
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: object }) =>
      bookingApi.update(bookingId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking', vars.bookingId] });
      toast.success('Booking updated successfully');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update booking');
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingApi.delete(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking deleted');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to delete booking');
    },
  });
}
