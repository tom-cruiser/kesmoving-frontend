import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooking } from '../../hooks/useBookings';
import { useRealtimeTracking } from '../../hooks/useTracking';
import { Loader } from '@googlemaps/js-api-loader';
import { ArrowLeft, Navigation, Truck, MapPin, Phone, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateDisplay from '../../components/common/DateDisplay';

export default function TrackingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [mapError, setMapError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const { data: bookingData } = useBooking(bookingId!);
  const booking = bookingData?.data;
  const { location, isConnected } = useRealtimeTracking(bookingId);

  const position = location || booking?.crewAssignment?.truck
    ? location
    : null;

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setMapError('Map not configured. Contact support for live tracking.');
      setMapReady(false);
      return;
    }
    const loader = new Loader({ apiKey, version: 'weekly' });
    loader.load().then(() => {
      mapInstance.current = new google.maps.Map(mapRef.current!, {
        center: { lat: 43.6532, lng: -79.3832 }, // Toronto
        zoom: 12,
        disableDefaultUI: false,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      });
      setMapReady(true);
    }).catch(() => setMapError('Could not load map.'));
  }, []);

  // Update truck marker when location changes
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !location) return;
    const pos = { lat: location.lat, lng: location.lng };
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new google.maps.Marker({
        position: pos,
        map: mapInstance.current,
        title: 'Your Moving Truck',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#2563eb"/><text y="26" x="20" text-anchor="middle" font-size="18" fill="white">🚚</text></svg>'),
          scaledSize: new google.maps.Size(40, 40),
        },
      });
    }
    mapInstance.current.panTo(pos);
  }, [location, mapReady]);

  // Add destination marker once
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !booking) return;
    const addr = booking.destinationAddress;
    // We rely on geolocation from tracking; no geocoding call here
    // Just show destination label
  }, [mapReady, booking]);

  if (!booking) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/bookings/${bookingId}`)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Live Tracking</h1>
          <p className="text-sm text-slate-500">{booking.bookingNumber}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Map */}
      <div className="card p-0 overflow-hidden h-72 sm:h-96">
        {mapError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
            <Truck size={48} className="text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-sm">{mapError}</p>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>

      {/* Location Info */}
      {location && (
        <div className="card bg-primary-50 border border-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Navigation size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Truck Location Updated</p>
              {location.address && <p className="text-sm text-slate-600">{location.address}</p>}
              <p className="text-xs text-slate-400 mt-0.5">
                Last updated: {location.updatedAt ? <DateDisplay date={location.updatedAt} format="pp" /> : 'just now'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!location && (
        <div className="card text-center py-6">
          <Clock size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium text-sm">Waiting for truck location...</p>
          <p className="text-slate-400 text-xs mt-1">Location will appear once your crew starts moving</p>
        </div>
      )}

      {/* Booking Summary */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">Move Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-slate-600">
            <MapPin size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-slate-700">From: </span>
              {booking.pickupAddress.street}, {booking.pickupAddress.city}
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-600">
            <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-slate-700">To: </span>
              {booking.destinationAddress.street}, {booking.destinationAddress.city}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
