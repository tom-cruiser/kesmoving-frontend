import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useCreateBooking } from '../../hooks/useBookings';
import { estimateApi } from '../../services/api';
import { uploadFilesToImageKit } from '../../services/imagekit';
import { ChevronRight, ChevronLeft, Upload, X, Loader2, CheckCircle, AlertTriangle, MapPin, Calendar, Package } from 'lucide-react';
import type { AIEstimate } from '../../types';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  pickupAddress: { street: string; city: string; province: string; postalCode: string; country: string; floorNumber: string; hasElevator: boolean };
  destinationAddress: { street: string; city: string; province: string; postalCode: string; country: string; floorNumber: string; hasElevator: boolean };
  moveDate: string;
  moveSize: string;
  numberOfBedrooms: string;
  specialItems: string;
  notes: string;
  contactPhone: string;
}

const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];
const MOVE_SIZES = ['Studio','1 Bedroom','2 Bedrooms','3 Bedrooms','4+ Bedrooms','Office/Commercial'];

const emptyAddress = { street: '', city: '', province: 'ON', postalCode: '', country: 'Canada', floorNumber: '', hasElevator: false };

export default function NewBookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<AIEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  const [form, setForm] = useState<FormData>({
    pickupAddress: { ...emptyAddress },
    destinationAddress: { ...emptyAddress },
    moveDate: '',
    moveSize: '2 Bedrooms',
    numberOfBedrooms: '2',
    specialItems: '',
    notes: '',
    contactPhone: '',
  });

  const createBooking = useCreateBooking();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024,
    onDrop: (accepted) => {
      setPhotos((prev) => [...prev, ...accepted].slice(0, 20));
      setUploadedUrls([]);
      setEstimate(null);
      setEstimateError('');
    },
  });

  const setAddress = (field: 'pickupAddress' | 'destinationAddress', key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: { ...f[field], [key]: value } }));
  };

  const getEstimate = async () => {
    if (photos.length === 0) {
      setEstimate({ itemsDetected: [], estimatedVolume: 0, estimatedWeight: 0, loadingTime: 0, aiConfidence: 0, recommendedTruck: 'Medium Truck', estimatedPrice: 0, needsManualReview: true, rawAiResponse: '' });
      setStep(4);
      return;
    }
    setEstimateLoading(true);
    setEstimateError('');
    try {
      const photoUrls = await uploadFilesToImageKit(photos);
      setUploadedUrls(photoUrls);

      const res = await estimateApi.analyzePhotoUrls({
        photoUrls,
        moveSize: form.moveSize,
        distance: undefined,
        numberOfBedrooms: parseInt(form.numberOfBedrooms) || 1,
        moveDate: form.moveDate,
        notes: form.notes,
        pickup: {
          address: `${form.pickupAddress.street}, ${form.pickupAddress.city}`,
          province: form.pickupAddress.province,
          elevator: form.pickupAddress.hasElevator,
        },
        destination: {
          address: `${form.destinationAddress.street}, ${form.destinationAddress.city}`,
          province: form.destinationAddress.province,
          elevator: form.destinationAddress.hasElevator,
          floor: Number(form.destinationAddress.floorNumber) || 1,
        },
      });
      const { photoUrls: returnedPhotoUrls, ...estimateData } = res.data.data;
      setEstimate(estimateData);
      if (returnedPhotoUrls?.length) setUploadedUrls(returnedPhotoUrls);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload and analyze photos.';
      setEstimateError(`${message} You can still proceed and our team will review manually.`);
      setEstimate({ itemsDetected: [], estimatedVolume: 0, estimatedWeight: 0, loadingTime: 0, aiConfidence: 0, recommendedTruck: 'Medium Truck', estimatedPrice: 0, needsManualReview: true, rawAiResponse: '' });
    } finally {
      setEstimateLoading(false);
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    // Clean addresses: extract only fields defined in addressSchema
    const pickupAddressClean = {
      street: form.pickupAddress.street,
      city: form.pickupAddress.city,
      province: form.pickupAddress.province,
      postalCode: form.pickupAddress.postalCode,
      country: form.pickupAddress.country,
    };
    
    const destinationAddressClean = {
      street: form.destinationAddress.street,
      city: form.destinationAddress.city,
      province: form.destinationAddress.province,
      postalCode: form.destinationAddress.postalCode,
      country: form.destinationAddress.country,
    };

    const payload: Record<string, unknown> = {
      pickupAddress: pickupAddressClean,
      destinationAddress: destinationAddressClean,
      floorDetails: {
        pickupFloor: form.pickupAddress.floorNumber ? parseInt(form.pickupAddress.floorNumber) : undefined,
        destinationFloor: form.destinationAddress.floorNumber ? parseInt(form.destinationAddress.floorNumber) : undefined,
        hasElevator: form.destinationAddress.hasElevator,
      },
      moveDate: form.moveDate,
      moveSize: form.moveSize,
      numberOfBedrooms: parseInt(form.numberOfBedrooms) || 0,
      specialItems: form.specialItems.split('\n').filter(Boolean),
      notes: form.notes,
    };
    if (uploadedUrls.length) payload.itemPhotos = uploadedUrls;
    if (estimate) payload.aiEstimate = estimate;

    try {
      const res = await createBooking.mutateAsync(payload);
      navigate(`/bookings/${res.data.data._id}`);
    } catch {
      // toast is already shown by useCreateBooking's onError
    }
  };

  const renderAddressFields = (field: 'pickupAddress' | 'destinationAddress', label: string) => (
    <div className="space-y-3">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <MapPin size={16} className="text-primary-500" /> {label}
      </h3>
      <input className="input" placeholder="Street address" value={form[field].street} onChange={(e) => setAddress(field, 'street', e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" placeholder="City" value={form[field].city} onChange={(e) => setAddress(field, 'city', e.target.value)} required />
        <select className="input" value={form[field].province} onChange={(e) => setAddress(field, 'province', e.target.value)}>
          {PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="input" placeholder="Postal code (A1A 1A1)" value={form[field].postalCode} onChange={(e) => setAddress(field, 'postalCode', e.target.value)} required />
        <input className="input" placeholder="Floor # (optional)" value={form[field].floorNumber} onChange={(e) => setAddress(field, 'floorNumber', e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={form[field].hasElevator} onChange={(e) => setAddress(field, 'hasElevator', e.target.checked)} className="rounded" />
        Elevator available
      </label>
    </div>
  );

  const steps = [
    { num: 1, label: 'Addresses', icon: MapPin },
    { num: 2, label: 'Details', icon: Calendar },
    { num: 3, label: 'Photos', icon: Package },
    { num: 4, label: 'Confirm', icon: CheckCircle },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Book Your Move</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map(({ num, label, icon: Icon }, i) => (
          <div key={num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${step >= num ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step > num ? <CheckCircle size={16} /> : <Icon size={16} />}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${step >= num ? 'text-primary-600 font-medium' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > num ? 'bg-primary-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div className="space-y-6">
            {renderAddressFields('pickupAddress', 'Pickup Address')}
            <hr />
            {renderAddressFields('destinationAddress', 'Destination Address')}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Calendar size={16} className="text-primary-500" /> Move Details</h3>
            <div>
              <label className="label">Move Date *</label>
              <input type="datetime-local" className="input" value={form.moveDate} min={new Date().toISOString().slice(0, 16)} onChange={(e) => setForm((f) => ({ ...f, moveDate: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Move Size</label>
              <select className="input" value={form.moveSize} onChange={(e) => setForm((f) => ({ ...f, moveSize: e.target.value }))}>
                {MOVE_SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Number of Bedrooms</label>
              <input type="number" className="input" min={0} max={10} value={form.numberOfBedrooms} onChange={(e) => setForm((f) => ({ ...f, numberOfBedrooms: e.target.value }))} />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input type="tel" className="input" placeholder="+1 (416) 555-0100" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Special Items (one per line)</label>
              <textarea className="input min-h-[80px]" placeholder="Piano&#10;Large safe&#10;Grand piano" value={form.specialItems} onChange={(e) => setForm((f) => ({ ...f, specialItems: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes for our team</label>
              <textarea className="input min-h-[80px]" placeholder="Any special instructions..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-1"><Package size={16} className="text-primary-500" /> Upload Item Photos</h3>
              <p className="text-sm text-slate-500">Optional but recommended — our AI will analyse your items for a more accurate estimate.</p>
            </div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-300'}`}
            >
              <input {...getInputProps()} />
              <Upload size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">{isDragActive ? 'Drop photos here...' : 'Drag & drop photos or click to browse'}</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP — max 10MB each, up to 20 photos</p>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((file, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-20 object-cover rounded-lg" />
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><CheckCircle size={16} className="text-primary-500" /> Confirm Your Booking</h3>

            {estimateLoading && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 size={32} className="animate-spin text-primary-600" />
                <p className="text-slate-600 font-medium">Analysing your items with AI...</p>
                <p className="text-slate-400 text-sm">This may take a moment</p>
              </div>
            )}

            {!estimateLoading && estimate && (
              <div className={`rounded-xl p-4 ${estimate.needsManualReview ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {estimate.needsManualReview
                    ? <AlertTriangle size={18} className="text-amber-600" />
                    : <CheckCircle size={18} className="text-green-600" />}
                  <span className="font-semibold text-slate-800">
                    {estimate.needsManualReview ? 'Manual Review Required' : 'AI Estimate Ready'}
                  </span>
                  {!estimate.needsManualReview && (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full ml-auto">
                      {Math.round(estimate.aiConfidence * 100)}% confidence
                    </span>
                  )}
                </div>
                {(estimate.estimatedPrice ?? 0) > 0 && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Estimated price</span><p className="font-bold text-lg text-slate-900">${(estimate.estimatedPrice ?? 0).toLocaleString()}</p></div>
                    <div><span className="text-slate-500">Recommended truck</span><p className="font-semibold text-slate-800">{estimate.recommendedTruck}</p></div>
                    <div><span className="text-slate-500">Volume</span><p className="font-semibold">{estimate.estimatedVolume} cu ft</p></div>
                    <div><span className="text-slate-500">Est. loading time</span><p className="font-semibold">{estimate.loadingTime}h</p></div>
                  </div>
                )}
                {estimate.needsManualReview && (
                  <p className="text-sm text-amber-700 mt-2">Our team will review your booking and confirm the price within 2 hours.</p>
                )}
                {estimateError && <p className="text-sm text-amber-700 mt-2">{estimateError}</p>}
              </div>
            )}

            {!estimateLoading && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">From</span><span className="font-medium">{form.pickupAddress.city}, {form.pickupAddress.province}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">To</span><span className="font-medium">{form.destinationAddress.city}, {form.destinationAddress.province}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Move date</span><span className="font-medium">{form.moveDate ? new Date(form.moveDate).toLocaleString('en-CA') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Size</span><span className="font-medium">{form.moveSize}</span></div>
                {photos.length > 0 && <div className="flex justify-between"><span className="text-slate-500">Photos</span><span className="font-medium">{photos.length} uploaded</span></div>}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : navigate('/dashboard')}
            className="btn-secondary flex items-center gap-1.5"
          >
            <ChevronLeft size={16} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 && (
            <button onClick={() => setStep((s) => (s + 1) as Step)} className="btn-primary flex items-center gap-1.5">
              Next
              <ChevronRight size={16} />
            </button>
          )}
          {step === 3 && (
            <button onClick={getEstimate} disabled={estimateLoading} className="btn-primary flex items-center gap-1.5">
              {estimateLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              Get Estimate
            </button>
          )}
          {step === 4 && !estimateLoading && (
            <button onClick={handleSubmit} disabled={createBooking.isPending} className="btn-primary flex items-center gap-1.5">
              {createBooking.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
