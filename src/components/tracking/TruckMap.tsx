import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';
import { io, type Socket } from 'socket.io-client';
import { Clock, Navigation, Radio, Truck as TruckIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import LoadingSpinner from '../common/LoadingSpinner';
import DateDisplay from '../common/DateDisplay';
import { useAuthStore } from '../../store/authStore';
import type { Truck } from '../../types';

export interface TruckData {
  id: string;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'delayed';
  lastUpdated: string;
}

interface TruckMapProps {
  trucks: Truck[];
  isLoading?: boolean;
}

const DEFAULT_CENTER: LatLngTuple = [43.6532, -79.3832];

const statusLabel: Record<TruckData['status'], string> = {
  active: 'Active',
  idle: 'Idle',
  delayed: 'Delayed',
};

const iconColor: Record<TruckData['status'], string> = {
  active: '#0f766e',
  idle: '#2563eb',
  delayed: '#dc2626',
};

const markerIconCache: Partial<Record<TruckData['status'], L.Icon>> = {};

function formatCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function toTrackingStatus(status: Truck['status']): TruckData['status'] {
  if (status === 'InUse') return 'active';
  if (status === 'Available') return 'idle';
  return 'delayed';
}

function buildTruckData(truck: Truck): TruckData | null {
  if (truck.currentLocation?.lat == null || truck.currentLocation?.lng == null) {
    return null;
  }

  return {
    id: truck._id,
    lat: truck.currentLocation.lat,
    lng: truck.currentLocation.lng,
    status: toTrackingStatus(truck.status),
    lastUpdated: truck.currentLocation.updatedAt || new Date().toISOString(),
  };
}

function getTruckIcon(status: TruckData['status']) {
  if (!markerIconCache[status]) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="${iconColor[status]}" />
        <path fill="#ffffff" d="M12 15.5h14c.83 0 1.5.67 1.5 1.5V22H31c.47 0 .92.22 1.2.6l3.5 4.55c.2.26.3.58.3.9V31c0 .83-.67 1.5-1.5 1.5h-1.2a3.8 3.8 0 0 1-7.4 0H18.1a3.8 3.8 0 0 1-7.4 0H9.5c-.83 0-1.5-.67-1.5-1.5V17c0-.83.67-1.5 1.5-1.5Zm15.5 9.5h5.27l-2.45-3.2H27.5V25Zm-14.25 6.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1Zm15.8 0a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1Z" />
      </svg>
    `.trim();

    markerIconCache[status] = L.icon({
      iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -18],
      className: 'truck-marker-icon',
    });
  }

  return markerIconCache[status]!;
}

function MapViewportController({ selectedTruck }: { selectedTruck: TruckData | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedTruck) return;

    map.flyTo([selectedTruck.lat, selectedTruck.lng], Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 0.8,
    });
  }, [map, selectedTruck]);

  return null;
}

interface TruckMarkerProps {
  truck: TruckData;
  displayId: string;
  isSelected: boolean;
  onSelect: (truckId: string) => void;
}

const TruckMarker = memo(function TruckMarker({ truck, displayId, isSelected, onSelect }: TruckMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (isSelected) {
      markerRef.current?.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[truck.lat, truck.lng]}
      icon={getTruckIcon(truck.status)}
      eventHandlers={{ click: () => onSelect(truck.id) }}
    >
      <Popup>
        <div className="min-w-[12rem] space-y-2 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">Truck {displayId}</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">Live position</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Status</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              {statusLabel[truck.status]}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Coordinates</span>
            <span className="font-medium text-slate-900">{formatCoordinates(truck.lat, truck.lng)}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}, (prevProps, nextProps) => (
  prevProps.truck === nextProps.truck
  && prevProps.displayId === nextProps.displayId
  && prevProps.isSelected === nextProps.isSelected
));

export default function TruckMap({ trucks, isLoading = false }: TruckMapProps) {
  const token = useAuthStore((state) => state.token);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [truckState, setTruckState] = useState<Record<string, TruckData>>(() => {
    const initialState: Record<string, TruckData> = {};

    for (const truck of trucks) {
      const entry = buildTruckData(truck);
      if (entry) initialState[truck._id] = entry;
    }

    return initialState;
  });

  const truckIds = useMemo(() => trucks.map((truck) => truck._id), [trucks]);
  const truckIdsKey = truckIds.join(',');
  const truckMeta = useMemo(() => Object.fromEntries(trucks.map((truck) => [truck._id, truck])) as Record<string, Truck>, [trucks]);

  useEffect(() => {
    setTruckState((prevState) => {
      const nextState: Record<string, TruckData> = {};
      let hasChanges = false;

      for (const truck of trucks) {
        const existing = prevState[truck._id];
        if (existing) {
          const nextStatus = toTrackingStatus(truck.status);
          const nextTruck = existing.status === nextStatus ? existing : { ...existing, status: nextStatus };
          if (nextTruck !== existing) hasChanges = true;
          nextState[truck._id] = nextTruck;
          continue;
        }

        const initialTruck = buildTruckData(truck);
        if (initialTruck) {
          nextState[truck._id] = initialTruck;
          hasChanges = true;
        }
      }

      if (Object.keys(prevState).length !== Object.keys(nextState).length) {
        hasChanges = true;
      }

      return hasChanges ? nextState : prevState;
    });
  }, [trucks]);

  useEffect(() => {
    if (selectedTruckId && !truckMeta[selectedTruckId]) {
      setSelectedTruckId(null);
    }
  }, [selectedTruckId, truckMeta]);

  useEffect(() => {
    if (!token || !truckIds.length) {
      setIsConnected(false);
      return;
    }

    const watchedTrucks = new Set(truckIds);
    const socket: Socket = io('/tracking', {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleTruckUpdate = (payload: TruckData) => {
      if (!watchedTrucks.has(payload.id)) return;

      setTruckState((prevState) => {
        const current = prevState[payload.id];
        if (
          current
          && current.lat === payload.lat
          && current.lng === payload.lng
          && current.status === payload.status
          && current.lastUpdated === payload.lastUpdated
        ) {
          return prevState;
        }

        return {
          ...prevState,
          [payload.id]: payload,
        };
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('truck_update', handleTruckUpdate);

    if (socket.connected) {
      handleConnect();
    }

    for (const truckId of truckIds) {
      socket.emit('client:watch', { truckId });
    }

    return () => {
      for (const truckId of truckIds) {
        socket.emit('client:unwatch', { truckId });
      }

      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('truck_update', handleTruckUpdate);
      socket.disconnect();
    };
  }, [token, truckIds, truckIdsKey]);

  const trackedTrucks = useMemo(() => Object.values(truckState), [truckState]);
  const selectedTruck = selectedTruckId ? truckState[selectedTruckId] ?? null : null;
  const sortedFleet = useMemo(() => {
    return [...trucks].sort((left, right) => {
      if (left.status === 'InUse' && right.status !== 'InUse') return -1;
      if (left.status !== 'InUse' && right.status === 'InUse') return 1;
      return left.licensePlate.localeCompare(right.licensePlate);
    });
  }, [trucks]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_22rem]">
      <div className="card relative h-[28rem] overflow-hidden p-0">
        <MapContainer center={DEFAULT_CENTER} zoom={11} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewportController selectedTruck={selectedTruck} />
          {trackedTrucks.map((truck) => (
            <TruckMarker
              key={truck.id}
              truck={truck}
              displayId={truckMeta[truck.id]?.truckId || truckMeta[truck.id]?.licensePlate || truck.id}
              isSelected={selectedTruckId === truck.id}
              onSelect={setSelectedTruckId}
            />
          ))}
        </MapContainer>

        {trackedTrucks.length === 0 && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-white/90 text-center backdrop-blur-sm">
            <Navigation size={34} className="mb-3 text-slate-300" />
            <p className="font-medium text-slate-700">No live truck coordinates yet</p>
            <p className="mt-1 text-sm text-slate-400">Markers appear as soon as a driver starts sending GPS updates.</p>
          </div>
        )}
      </div>

      <div className="card max-h-[28rem] overflow-y-auto">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Tracked Fleet</h3>
            <p className="text-sm text-slate-500">{trackedTrucks.length} truck{trackedTrucks.length === 1 ? '' : 's'} with coordinates</p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <Radio size={12} className={isConnected ? 'animate-pulse' : ''} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>

        {sortedFleet.length === 0 ? (
          <div className="py-8 text-center">
            <TruckIcon size={30} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">No trucks available.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedFleet.map((truck) => {
              const liveTruck = truckState[truck._id];
              const isSelected = selectedTruckId === truck._id;

              return (
                <button
                  key={truck._id}
                  type="button"
                  onClick={() => liveTruck && setSelectedTruckId(truck._id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'} ${liveTruck ? '' : 'opacity-60'}`}
                >
                  <div className="flex items-center gap-2">
                    <TruckIcon size={14} className="text-primary-600" />
                    <span className="font-medium text-slate-900">{truck.licensePlate}</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${liveTruck?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : liveTruck?.status === 'delayed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel[liveTruck?.status || toTrackingStatus(truck.status)]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{truck.truckId} · {truck.make} {truck.model}</p>
                  {liveTruck ? (
                    <>
                      <p className="mt-1 text-xs text-slate-600">{formatCoordinates(liveTruck.lat, liveTruck.lng)}</p>
                      <p className="mt-1 text-xs text-slate-400">Updated <DateDisplay date={liveTruck.lastUpdated} format="p" /></p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">Awaiting GPS updates</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedTruck && truckMeta[selectedTruck.id] && (
        <div className="card border-l-4 border-l-primary-500 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">
                {truckMeta[selectedTruck.id].licensePlate} · {truckMeta[selectedTruck.id].year} {truckMeta[selectedTruck.id].make} {truckMeta[selectedTruck.id].model}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {truckMeta[selectedTruck.id].capacity.label} · {statusLabel[selectedTruck.status]}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedTruckId(null)} className="text-slate-400 transition-colors hover:text-slate-600">
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Navigation size={14} className="text-primary-500" />
              {formatCoordinates(selectedTruck.lat, selectedTruck.lng)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              <DateDisplay date={selectedTruck.lastUpdated} format="PPpp" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}