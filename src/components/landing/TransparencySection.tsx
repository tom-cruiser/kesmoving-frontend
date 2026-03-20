import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TransparencySection() {
  const comparison = [
    {
      feature: 'Hidden Fuel Surcharges',
      kesmoving: false,
      typical: true,
    },
    {
      feature: 'Professional Floor Protection',
      kesmoving: true,
      typical: false,
    },
    {
      feature: '24/7 GPS Tracking',
      kesmoving: true,
      typical: false,
    },
    {
      feature: 'Full Insurance Included',
      kesmoving: true,
      typical: false,
    },
    {
      feature: 'Transparent Online Quotes',
      kesmoving: true,
      typical: false,
    },
    {
      feature: 'Free Storage (30 days)',
      kesmoving: true,
      typical: false,
    },
    {
      feature: 'Dedicated Move Coordinator',
      kesmoving: true,
      typical: false,
    },
    {
      feature: 'Last-Minute Price Increases',
      kesmoving: false,
      typical: true,
    },
  ];

  return (
    <section className="py-20 bg-white" id="why-us">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            The Kesmoving Difference
          </h2>
          <p className="text-xl text-gray-600">
            Complete transparency. No surprises. Just honest, expert moving.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-4 px-6 font-bold text-gray-900">
                  What's Included
                </th>
                <th className="text-center py-4 px-6 font-bold text-blue-600">
                  Kesmoving
                </th>
                <th className="text-center py-4 px-6 font-bold text-gray-500">
                  Typical Movers
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {item.feature}
                  </td>
                  <td className="text-center py-4 px-6">
                    {item.kesmoving ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-4 px-6">
                    {item.typical ? (
                      <XCircle className="w-6 h-6 text-red-500 mx-auto" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-8 mt-16 pt-16 border-t">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
            <p className="text-gray-600">Google Reviews</p>
            <p className="text-sm text-gray-500 mt-2">2,847 reviews</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
            <p className="text-gray-600">Successful Moves</p>
            <p className="text-sm text-gray-500 mt-2">Since 2010</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">99.2%</div>
            <p className="text-gray-600">On-Time Rate</p>
            <p className="text-sm text-gray-500 mt-2">Industry leading</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">$0</div>
            <p className="text-gray-600">Hidden Fees</p>
            <p className="text-sm text-gray-500 mt-2">Ever</p>
          </div>
        </div>
      </div>
    </section>
  );
}
