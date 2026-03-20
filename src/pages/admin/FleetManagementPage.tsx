import { useState } from 'react';
import { useFleet, useCreateTruck, useUpdateTruck } from '../../hooks/useFleet';
import { Plus, Truck, Edit2, X, Loader2, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Truck as TruckType } from '../../types';
import toast from 'react-hot-toast';

type TruckStatus = 'Available' | 'InUse' | 'Maintenance' | 'OutOfService';

const STATUS_COLORS: Record<TruckStatus, string> = {
  Available: 'bg-green-100 text-green-700',
  InUse: 'bg-blue-100 text-blue-700',
  Maintenance: 'bg-amber-100 text-amber-700',
  OutOfService: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<TruckStatus, JSX.Element> = {
  Available: <CheckCircle size={14} />,
  InUse: <Truck size={14} />,
  Maintenance: <Wrench size={14} />,
  OutOfService: <AlertTriangle size={14} />,
};

interface TruckFormData {
  make: string; model: string; year: string; licensePlate: string;
  capacity: { volume: string; weight: string; label: string };
  status: TruckStatus;
}

const defaultForm: TruckFormData = {
  make: '', model: '', year: new Date().getFullYear().toString(), licensePlate: '',
  capacity: { volume: '800', weight: '5000', label: 'Medium Truck' },
  status: 'Available',
};

const CAPACITY_LABELS = ['Small Truck', 'Medium Truck', 'Large Truck', 'Extra Large Truck'];

function TruckModal({ truck, onClose }: { truck: TruckType | null; onClose: () => void }) {
  const createTruck = useCreateTruck();
  const updateTruck = useUpdateTruck();
  const [form, setForm] = useState<TruckFormData>(
    truck
      ? {
          make: truck.make, model: truck.model, year: String(truck.year), licensePlate: truck.licensePlate,
          capacity: { volume: String(truck.capacity.volume), weight: String(truck.capacity.weight), label: truck.capacity.label },
          status: truck.status as TruckStatus,
        }
      : defaultForm
  );

  const set = (key: keyof TruckFormData, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setCap = (key: keyof TruckFormData['capacity'], value: string) => setForm((f) => ({ ...f, capacity: { ...f.capacity, [key]: value } }));

  const handleSave = async () => {
    if (!form.make || !form.model || !form.licensePlate) { toast.error('Fill in required fields'); return; }
    const payload = {
      ...form,
      year: parseInt(form.year),
      capacity: { volume: parseInt(form.capacity.volume), weight: parseInt(form.capacity.weight), label: form.capacity.label },
    };
    try {
      if (truck) {
        await updateTruck.mutateAsync({ truckId: truck._id, data: payload });
        toast.success('Truck updated');
      } else {
        await createTruck.mutateAsync(payload);
        toast.success('Truck added to fleet');
      }
      onClose();
    } catch {
      toast.error('Failed to save truck');
    }
  };

  const isPending = createTruck.isPending || updateTruck.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{truck ? 'Edit Truck' : 'Add Truck'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Make *</label><input className="input" placeholder="Freightliner" value={form.make} onChange={(e) => set('make', e.target.value)} /></div>
            <div><label className="label">Model *</label><input className="input" placeholder="Cascadia" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Year</label><input type="number" className="input" value={form.year} onChange={(e) => set('year', e.target.value)} /></div>
            <div><label className="label">License Plate *</label><input className="input" placeholder="ABC 123" value={form.licensePlate} onChange={(e) => set('licensePlate', e.target.value)} /></div>
          </div>
          <div>
            <label className="label">Capacity Type</label>
            <select className="input" value={form.capacity.label} onChange={(e) => setCap('label', e.target.value)}>
              {CAPACITY_LABELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Volume (cu ft)</label><input type="number" className="input" value={form.capacity.volume} onChange={(e) => setCap('volume', e.target.value)} /></div>
            <div><label className="label">Weight capacity (lbs)</label><input type="number" className="input" value={form.capacity.weight} onChange={(e) => setCap('weight', e.target.value)} /></div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as TruckStatus)}>
              {Object.keys(STATUS_COLORS).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={isPending} className="btn-primary text-sm flex items-center gap-1.5">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {truck ? 'Save Changes' : 'Add Truck'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FleetManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null);
  const [filter, setFilter] = useState<TruckStatus | ''>('');
  const { data, isLoading } = useFleet();
  const trucks: TruckType[] = data?.data || [];

  const filtered = filter ? trucks.filter((t) => t.status === filter) : trucks;

  return (
    <div className="space-y-5 animate-fade-in">
      {(showModal || editingTruck) && (
        <TruckModal
          truck={editingTruck}
          onClose={() => { setShowModal(false); setEditingTruck(null); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet Management</h1>
          <p className="text-slate-500 text-sm">{trucks.length} truck{trucks.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} />
          Add Truck
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${!filter ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>
          All ({trucks.length})
        </button>
        {(Object.keys(STATUS_COLORS) as TruckStatus[]).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-sm px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${filter === s ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>
            {s} ({trucks.filter((t) => t.status === s).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Truck size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No trucks found</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">Add Your First Truck</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((truck) => (
            <div key={truck._id} className="card hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Truck size={22} className="text-slate-600" />
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[truck.status as TruckStatus]}`}>
                  {STATUS_ICONS[truck.status as TruckStatus]}
                  {truck.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">{truck.year} {truck.make} {truck.model}</h3>
              <p className="text-sm text-slate-500">{truck.licensePlate}</p>
              <div className="mt-3 pt-3 border-t text-xs text-slate-500 space-y-1">
                <p>{truck.capacity.label} · {truck.capacity.volume} cu ft · {truck.capacity.weight.toLocaleString()} lbs</p>
                {truck.currentLocation?.address && <p className="truncate">📍 {truck.currentLocation.address}</p>}
              </div>
              <button
                onClick={() => setEditingTruck(truck)}
                className="mt-3 w-full btn-secondary text-xs flex items-center justify-center gap-1.5"
              >
                <Edit2 size={12} />
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
