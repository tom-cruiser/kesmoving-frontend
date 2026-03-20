import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../services/api';
import { useEffect, useRef, useState } from 'react';
import { getTrackingSocket } from '../services/socket';
import type { GeoLocation } from '../types';

export function useTruckTracking(truckId: string) {
  return useQuery({
    queryKey: ['tracking', 'truck', truckId],
    queryFn: async () => {
      const res = await trackingApi.getTruckLocation(truckId);
      return res.data.data;
    },
    enabled: !!truckId,
    refetchInterval: 30_000,
  });
}

export function useBookingTracking(bookingId: string) {
  return useQuery({
    queryKey: ['tracking', 'booking', bookingId],
    queryFn: async () => {
      const res = await trackingApi.getBookingTracking(bookingId);
      return res.data.data;
    },
    enabled: !!bookingId,
  });
}

/**
 * Hook for real-time location updates via Socket.io for a single booking.
 * Returns the current location and connection state.
 */
export function useRealtimeTracking(bookingId: string | undefined) {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const socket = getTrackingSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onLocationUpdate = (data: { bookingId: string; location: GeoLocation }) => {
      if (data.bookingId === bookingId) setLocation(data.location);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('locationUpdate', onLocationUpdate);
    socket.emit('client:watch', { bookingId });
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.emit('client:unwatch', { bookingId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('locationUpdate', onLocationUpdate);
    };
  }, [bookingId]);

  return { location, isConnected };
}

/**
 * Hook for tracking multiple trucks simultaneously (admin fleet view).
 * Returns a map of truckId → latest GeoLocation.
 */
export function useAllTrucksTracking(truckIds: string[]) {
  const [locations, setLocations] = useState<Record<string, GeoLocation>>({});

  useEffect(() => {
    if (!truckIds.length) return;
    const socket = getTrackingSocket();

    const onLocationUpdate = (data: { truckId?: string; bookingId?: string; location: GeoLocation }) => {
      const id = data.truckId || data.bookingId;
      if (id && truckIds.includes(id)) {
        setLocations((prev) => ({ ...prev, [id]: data.location }));
      }
    };

    socket.on('locationUpdate', onLocationUpdate);
    truckIds.forEach((id) => socket.emit('client:watch', { truckId: id }));

    return () => {
      socket.off('locationUpdate', onLocationUpdate);
      truckIds.forEach((id) => socket.emit('client:unwatch', { truckId: id }));
    };
  }, [truckIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { locations };
}
