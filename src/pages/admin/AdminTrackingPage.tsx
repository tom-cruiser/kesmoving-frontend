import { useFleet } from '../../hooks/useFleet';
import TruckMap from '../../components/tracking/TruckMap';
import type { Truck as TruckType } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminTrackingPage() {
  const { data: fleetData, isLoading } = useFleet();
  const trucks: TruckType[] = fleetData?.data || [];
  const activeTrucks = trucks.filter((truck) => truck.status === 'InUse');

  if (isLoading) {
    return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet Tracking</h1>
          <p className="text-sm text-slate-500">{activeTrucks.length} truck{activeTrucks.length === 1 ? '' : 's'} active now</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
          OpenStreetMap + Leaflet
        </div>
      </div>

      <TruckMap trucks={trucks} />
    </div>
  );
}
