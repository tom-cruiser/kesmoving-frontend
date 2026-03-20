import React from 'react';
import { Camera, Zap, Clock, DollarSign, Check } from 'lucide-react';

export default function AIInventorySection() {
  const steps = [
    {
      icon: Camera,
      title: 'Snap Photos',
      description: 'Take 5-10 quick photos of your rooms',
    },
    {
      icon: Zap,
      title: 'AI Analysis',
      description: 'Our AI vision system catalogs everything',
    },
    {
      icon: Clock,
      title: 'Accurate Timeline',
      description: 'Get precise moving time estimates',
    },
    {
      icon: DollarSign,
      title: 'Perfect Pricing',
      description: 'No surprises. Transparent quotes.',
    },
  ];

  return (
    <section className="py-20 bg-white" id="ai-inventory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Inventory Estimates
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Say goodbye to guesswork. Our Vision-to-Time technology analyzes your belongings 
            and provides specialized, accurate estimates in minutes. No more surprises on moving day.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 text-center hover:shadow-lg transition">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 mx-auto">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/3 -right-4 items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white font-bold">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-2 gap-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-12">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Our AI Works Better</h3>
            <ul className="space-y-4">
              {[
                'Catalogs every item in your home',
                'Calculates weight and space needs',
                'Assesses fragility for packing',
                'Provides labor time estimates',
                'Flags specialty items (pianos, art)',
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-md">
            <h4 className="font-bold text-gray-900 mb-4">Quick Comparison</h4>
            <table className="w-full text-sm">
              <tbody className="space-y-3">
                <tr className="border-b">
                  <td className="py-3 font-semibold text-gray-700">Traditional Estimate</td>
                  <td className="py-3 text-right text-gray-600">3-5 days</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-semibold text-gray-700">Kesmoving AI Estimate</td>
                  <td className="py-3 text-right text-green-600 font-bold">15 minutes</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-semibold text-gray-700">Accuracy Rate</td>
                  <td className="py-3 text-right text-green-600 font-bold">99.2%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
