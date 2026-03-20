import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fromPostal: '',
    toPostal: '',
    moveDate: '',
    inventorySize: '',
    name: '',
    email: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would send to backend
    console.log('Form submitted:', formData);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Location */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From (Postal Code)
            </label>
            <input
              type="text"
              name="fromPostal"
              value={formData.fromPostal}
              onChange={handleInputChange}
              placeholder="e.g., M5V 3A8"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Toronto, Vancouver, Montreal, etc.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To (Postal Code)
            </label>
            <input
              type="text"
              name="toPostal"
              value={formData.toPostal}
              onChange={handleInputChange}
              placeholder="e.g., K1A 0B1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Inventory */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moving Date
            </label>
            <input
              type="date"
              name="moveDate"
              value={formData.moveDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inventory Size
            </label>
            <select
              name="inventorySize"
              value={formData.inventorySize}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            >
              <option value="">Select inventory size</option>
              <option value="studio">Studio (1 room)</option>
              <option value="1bedroom">1 Bedroom</option>
              <option value="2bedroom">2 Bedrooms</option>
              <option value="3bedroom">3 Bedrooms</option>
              <option value="4plus">4+ Bedrooms</option>
              <option value="office">Office/Commercial</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Contact Info */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Smith"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(416) 555-0123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p>✓ We'll send your quote within 1 hour</p>
            <p>✓ No hidden fees or obligations</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              {submitted ? '✓ Quote Sent!' : 'Get My Quote'}
            </button>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
