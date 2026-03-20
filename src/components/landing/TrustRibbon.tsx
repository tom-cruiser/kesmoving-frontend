import React from 'react';
import { Shield, Check, User, Zap } from 'lucide-react';

export default function TrustRibbon() {
  const trustItems = [
    {
      icon: Shield,
      title: 'Full Insurance Coverage',
      description: '100% goods protection up to $500K',
    },
    {
      icon: Check,
      title: 'Government Licensed',
      description: 'Provincial License #MOV-123456',
    },
    {
      icon: User,
      title: 'WSIB Compliant Staff',
      description: 'All movers fully insured and trained',
    },
    {
      icon: Zap,
      title: '24/7 GPS Tracking',
      description: 'Real-time monitoring of your belongings',
    },
  ];

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 py-12 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-600">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
