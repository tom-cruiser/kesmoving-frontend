import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle, Truck, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { uploadFilesToImageKit } from '../../services/imagekit';
import { estimateApi } from '../../services/api';
import { useCreateBooking } from '../../hooks/useBookings';
import { useAuthStore } from '../../store/authStore';
import { useLandingQuoteStore } from '../../store/landingQuoteStore';

const PROVINCES = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL'];

const BEDROOM_OPTIONS = [
  { label: 'Studio', value: 0 },
  { label: '1 Bed', value: 1 },
  { label: '2 Beds', value: 2 },
  { label: '3 Beds', value: 3 },
  { label: '4+ Beds', value: 4 },
];

function truckLabel(bedrooms: number) {
  if (bedrooms <= 1) return '20 ft Truck';
  if (bedrooms <= 3) return '26 ft Truck';
  return '26 ft+ Truck';
}

interface Estimate {
  total_cad: number;
  hours: number;
  confidence: number;
  warnings?: string[];
  breakdown?: { labor: number; stairs: number; fuel: number; specialtyTotal: number; tax: number };
  status?: string;
}

type Step = 1 | 2 | 'loading' | 'result' | 'error';

function StepDots({ step }: { step: Step }) {
  const n = step === 2 ? 2 : 1;
  return (
    <div className="flex gap-2 justify-center pt-1">
      {[1, 2].map(i => (
        <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= n ? 'bg-blue-600' : 'bg-gray-300'}`} />
      ))}
    </div>
  );
}

export default function QuoteForm() {
  const [step, setStep] = useState<Step>(1);
  const [pickup, setPickup] = useState({ city: '', province: 'ON', floor: '', elevator: false });
  const [destination, setDestination] = useState({ city: '', province: 'ON', floor: '', elevator: false });
  const [moveDate, setMoveDate] = useState('');
  const [bedrooms, setBedrooms] = useState(2);
  const [hasPiano, setHasPiano] = useState(false);
  const [hasPoolTable, setHasPoolTable] = useState(false);
  const [hasSafe, setHasSafe] = useState(false);
  const [result, setResult] = useState<Estimate | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const createBooking = useCreateBooking();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setLandingQuote, clearLandingQuote } = useLandingQuoteStore();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 12,
    maxSize: 10 * 1024 * 1024,
    onDrop: (accepted) => {
      setPhotos((p) => [...p, ...accepted].slice(0, 12));
      setUploadedUrls([]);
      setResult(null);
      setErrorMsg('');
    },
  });

  const handleGetEstimate = async () => {
    // Basic client-side validation
    if (!pickup.city || !destination.city) {
      setErrorMsg('Please enter both pickup and destination cities.');
      setStep('error');
      toast.error('Please enter both pickup and destination cities.');
      return;
    }

    setIsSubmitting(true);
    setStep('loading');
    setErrorMsg('');
    try {
      // If photos provided, upload to ImageKit then call analyze by URLs
      if (photos.length > 0) {
        const urls = await uploadFilesToImageKit(photos);
        setUploadedUrls(urls);

        const res = await estimateApi.analyzePhotoUrls({
          photoUrls: urls,
          numberOfBedrooms: bedrooms,
          moveDate: moveDate ? new Date(moveDate).toISOString().slice(0, 10) : '',
          pickup: { address: pickup.city ? `${pickup.city}, ${pickup.province}` : '', province: pickup.province, elevator: pickup.elevator, floor: pickup.floor ? Number(pickup.floor) : undefined },
          destination: { address: destination.city ? `${destination.city}, ${destination.province}` : '', province: destination.province, elevator: destination.elevator, floor: destination.floor ? Number(destination.floor) : undefined },
        });
        const estimate = res?.data?.data;
        if (!estimate) throw new Error('Invalid response from server');
        setResult(estimate);
        setLandingQuote(estimate, {
          pickupCity: pickup.city,
          pickupProvince: pickup.province,
          destinationCity: destination.city,
          destinationProvince: destination.province,
          bedrooms,
          moveDate: moveDate ? new Date(moveDate).toISOString().slice(0, 10) : '',
        });
        setStep('result');
        toast.success('Estimate generated from photos');
      } else {
        // No photos: fallback to public quote endpoint
        const payload = {
          pickup: { city: pickup.city, province: pickup.province, elevator: pickup.elevator, ...(pickup.floor ? { floor: Number(pickup.floor) } : {}) },
          destination: { city: destination.city, province: destination.province, elevator: destination.elevator, ...(destination.floor ? { floor: Number(destination.floor) } : {}) },
          bedrooms,
          moveDate: moveDate ? new Date(moveDate).toISOString().slice(0, 10) : '',
          hasPiano,
          hasPoolTable,
          hasSafe,
        };
        const res = await axios.post('/api/estimate/public-quote', payload, { timeout: 15000 });
        const estimate = res?.data?.data;
        if (!estimate) throw new Error('Invalid response from server');
        setResult(estimate);
        setLandingQuote(estimate, {
          pickupCity: pickup.city,
          pickupProvince: pickup.province,
          destinationCity: destination.city,
          destinationProvince: destination.province,
          bedrooms,
          moveDate: moveDate ? new Date(moveDate).toISOString().slice(0, 10) : '',
          hasPiano,
          hasPoolTable,
          hasSafe,
        });
        setStep('result');
        toast.success('Estimate generated');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const fallback = msg || (err as Error).message || 'Could not generate estimate. Please try again.';
      setErrorMsg(fallback);
      setStep('error');
      toast.error(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => { setStep(1); setResult(null); setErrorMsg(''); clearLandingQuote(); };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-700 font-medium">Calculating your estimate…</p>
        <p className="text-sm text-gray-400">Our AI is analyzing your move details</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
        <button onClick={reset} className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
          Try Again
        </button>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    if (result.status === 'MANUAL_QUOTE_REQUIRED') {
      return (
        <div className="space-y-4 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-lg font-bold text-amber-800 mb-2">Custom Quote Required</p>
            <p className="text-sm text-amber-700">Your destination requires a custom quote. Our team will reach out within 2 hours.</p>
          </div>
          <Link to="/register" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
            Book & Get a Custom Quote <ChevronRight className="w-4 h-4" />
          </Link>
          <button onClick={reset} className="w-full text-sm text-gray-400 hover:text-gray-600 transition py-1">← Recalculate</button>
        </div>
      );
    }

    const { total_cad, hours, confidence, breakdown, warnings } = result;
    const pct = Math.round((confidence ?? 0.7) * 100);

    const breakdownRows: [string, number][] = breakdown ? [
      ['Labor', breakdown.labor],
      ...(breakdown.stairs > 0 ? [['Stairs', breakdown.stairs] as [string, number]] : []),
      ...(breakdown.fuel > 0 ? [['Fuel', breakdown.fuel] as [string, number]] : []),
      ...(breakdown.specialtyTotal > 0 ? [['Specialty Items', breakdown.specialtyTotal] as [string, number]] : []),
      ...(breakdown.tax > 0 ? [['Tax (HST/GST)', breakdown.tax] as [string, number]] : []),
    ] : [];

    return (
      <div className="space-y-4">
        {/* Price hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white text-center">
          <p className="text-blue-200 text-xs mb-1 uppercase tracking-wide">Estimated Cost</p>
          <p className="text-4xl font-bold">${total_cad.toLocaleString('en-CA', { maximumFractionDigits: 0 })}</p>
          <p className="text-blue-200 text-xs mt-1">CAD · Subject to final review</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900">{hours}h</p>
            <p className="text-xs text-gray-500">Est. Time</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Truck className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900 leading-tight">{truckLabel(bedrooms)}</p>
            <p className="text-xs text-gray-500">Truck Size</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900">{pct}%</p>
            <p className="text-xs text-gray-500">Confidence</p>
          </div>
        </div>

        {/* Breakdown */}
        {breakdownRows.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
            <p className="font-semibold text-gray-700 mb-2">Cost Breakdown</p>
            {breakdownRows.map(([label, amount]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">${amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
              <span>Total</span>
              <span>${total_cad.toLocaleString('en-CA', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
            {warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">⚠ {w}</p>)}
          </div>
        )}

        <Link to="/register" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
          Book This Move <ChevronRight className="w-4 h-4" />
        </Link>
        <button onClick={reset} className="w-full text-sm text-gray-400 hover:text-gray-600 transition py-1">
          ← Recalculate
        </button>
      </div>
    );
  }

  // ── Step 1: Locations ──────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Pickup</p>
          <div className="grid grid-cols-5 gap-2 mb-2">
            <input
              className="col-span-3 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="City (e.g. Toronto)"
              value={pickup.city}
              onChange={e => setPickup(p => ({ ...p, city: e.target.value }))}
            />
            <select
              className="col-span-2 px-2 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={pickup.province}
              onChange={e => setPickup(p => ({ ...p, province: e.target.value }))}
            >
              {PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number" min={1} max={50}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Floor (optional)"
              value={pickup.floor}
              onChange={e => setPickup(p => ({ ...p, floor: e.target.value }))}
            />
            <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={pickup.elevator} onChange={e => setPickup(p => ({ ...p, elevator: e.target.checked }))} />
              Elevator
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Destination</p>
          <div className="grid grid-cols-5 gap-2 mb-2">
            <input
              className="col-span-3 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="City (e.g. Ottawa)"
              value={destination.city}
              onChange={e => setDestination(p => ({ ...p, city: e.target.value }))}
            />
            <select
              className="col-span-2 px-2 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={destination.province}
              onChange={e => setDestination(p => ({ ...p, province: e.target.value }))}
            >
              {PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number" min={1} max={50}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Floor (optional)"
              value={destination.floor}
              onChange={e => setDestination(p => ({ ...p, floor: e.target.value }))}
            />
            <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={destination.elevator} onChange={e => setDestination(p => ({ ...p, elevator: e.target.checked }))} />
              Elevator
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Move Date <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={moveDate}
            onChange={e => setMoveDate(e.target.value)}
          />
        </div>

        <button
          type="button"
          disabled={!pickup.city || !destination.city}
          onClick={() => setStep(2)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
        <StepDots step={step} />
      </div>
    );
  }

  // ── Step 2: Move Details ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Home Size</p>
        <div className="grid grid-cols-5 gap-1.5">
          {BEDROOM_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBedrooms(opt.value)}
              className={`py-2.5 rounded-lg text-xs font-medium border transition ${
                bedrooms === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Special Items</p>
        <div className="space-y-2">
          {[
            { label: 'Piano', note: '+$500', val: hasPiano, set: setHasPiano },
            { label: 'Pool Table', note: '+$400', val: hasPoolTable, set: setHasPoolTable },
            { label: 'Heavy Safe', note: '+$300', val: hasSafe, set: setHasSafe },
          ].map(item => (
            <label
              key={item.label}
              className="flex items-center justify-between px-3.5 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={item.val} onChange={e => item.set(e.target.checked)} />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-xs text-gray-400">{item.note}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Photo upload (optional) */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Photos (optional)</p>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
        >
          <input {...getInputProps()} />
          <p className="text-sm text-gray-500">Drag & drop photos to get a more accurate AI estimate, or click to browse.</p>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max 10MB each, up to 12 photos</p>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {photos.map((file, i) => (
              <div key={i} className="relative group">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-20 object-cover rounded-lg" />
                <button
                  onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="sr-only">Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-4 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleGetEstimate}
          disabled={isSubmitting}
          className={`flex-1 py-3 rounded-lg font-bold transition ${isSubmitting ? 'bg-green-400 text-white cursor-wait' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {isSubmitting ? 'Calculating…' : 'Get My Estimate →'}
        </button>
      </div>
      <StepDots step={step} />

      {/* If user logged in and we have a result, allow saving as a booking */}
      {result && (
        <div className="mt-3">
          <button
            onClick={async () => {
              const payload: any = {
                pickupAddress: { street: '', city: pickup.city, province: pickup.province, postalCode: '', country: 'Canada', floorNumber: pickup.floor || '' },
                destinationAddress: { street: '', city: destination.city, province: destination.province, postalCode: '', country: 'Canada', floorNumber: destination.floor || '' },
                floorDetails: { pickupFloor: pickup.floor ? Number(pickup.floor) : undefined, destinationFloor: destination.floor ? Number(destination.floor) : undefined, hasElevator: destination.elevator },
                moveDate: moveDate || undefined,
                moveSize: `${bedrooms} bedrooms`,
                numberOfBedrooms: Number(bedrooms) || 0,
                specialItems: [hasPiano ? 'Piano' : null, hasPoolTable ? 'Pool table' : null, hasSafe ? 'Heavy safe' : null].filter(Boolean),
                notes: '',
              };
              if (uploadedUrls.length) payload.itemPhotos = uploadedUrls;
              if (result) payload.aiEstimate = result;
              try {
                if (isAuthenticated) {
                  await createBooking.mutateAsync(payload);
                } else {
                  // Create a guest booking via public endpoint
                  await axios.post('/api/bookings/public', payload, { timeout: 15000 });
                }
                toast.success('Booking created — we will follow up shortly');
                window.location.href = '/bookings';
              } catch (e) {
                const msg = (e as any)?.response?.data?.message || (e as Error).message || 'Failed to create booking';
                toast.error(msg);
              }
            }}
            className="w-full mt-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Save as Booking
          </button>
        </div>
      )}
    </div>
  );
}
