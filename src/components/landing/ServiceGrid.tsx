import React from 'react';
import { MapPin, Building2, Package, ArrowRight } from 'lucide-react';

export default function ServiceGrid() {
  const services = [
    {
      icon: MapPin,
      title: 'Local Moving',
      description: 'Within Greater Toronto Area, GTA, and major Canadian cities.',
      features: [
        'Same-day or next-day service',
        'Licensed, insured crews',
        'Real-time tracking',
        'Flexible scheduling',
      ],
      cta: 'Learn More',
    },
    {
      icon: Package,
      title: 'Long-Distance Moving',
      description: 'Safe, reliable inter-provincial moves across Canada.',
      features: [
        'Trans-Canada expertise',
        'Climate-controlled trucks',
        'Weekly scheduled routes',
        'Storage solutions available',
      ],
      cta: 'Learn More',
    },
    {
      icon: Building2,
      title: 'Office Relocation',
      description: 'Specialized corporate and office moves with minimal downtime.',
      features: [
        'Minimal business disruption',
        'IT equipment handling',
        'After-hours service',
        'Inventory management',
      ],
      cta: 'Learn More',
    },
  ];

  return (
    <section className="py-20 bg-gray-50" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600">
            Whatever you're moving, we've got the expertise to get it done right.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden group"
              >
                <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {service.description}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 group-hover:gap-3">
                    {service.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
