import React from 'react';
import { Star, MapPinIcon } from 'lucide-react';

export default function SocialProofGallery() {
  const reviews = [
    {
      name: 'Sarah M.',
      location: 'Toronto, ON',
      date: '2 weeks ago',
      rating: 5,
      text: 'Moved from Toronto to Ottawa. Kesmoving team was incredibly professional and handled our antiques like they were their own. Quote was exactly what we paid. Highly recommend!',
      verified: true,
    },
    {
      name: 'James K.',
      location: 'Vancouver, BC',
      date: '1 month ago',
      rating: 5,
      text: 'Best moving experience ever. The AI estimate was spot-on. No hidden charges. Friendly movers. Would book with them again in a heartbeat.',
      verified: true,
    },
    {
      name: 'Emily R.',
      location: 'Montreal, QC',
      date: '3 weeks ago',
      rating: 5,
      text: 'Moved our office and they coordinated everything perfectly. Minimal downtime, professional service, great follow-up. Worth every dollar.',
      verified: true,
    },
    {
      name: 'David L.',
      location: 'Calgary, AB',
      date: '1 month ago',
      rating: 5,
      text: 'The 24/7 tracking gave us peace of mind. Our belongings arrived safe and secure. The moving team was courteous and efficient.',
      verified: true,
    },
    {
      name: 'Patricia W.',
      location: 'Halifax, NS',
      date: '2 weeks ago',
      rating: 5,
      text: 'Excellent service from start to finish. Got my quote same day. Movers were on time, careful, and professional. 10/10 would recommend.',
      verified: true,
    },
    {
      name: 'Michael T.',
      location: 'Winnipeg, MB',
      date: '4 weeks ago',
      rating: 5,
      text: 'Moved across provinces with them. Everything arrived in perfect condition. Great communication throughout the move. Highly satisfied.',
      verified: true,
    },
  ];

  const cities = [
    { name: 'Toronto', moves: '12,456' },
    { name: 'Vancouver', moves: '8,923' },
    { name: 'Montreal', moves: '7,543' },
    { name: 'Calgary', moves: '4,321' },
    { name: 'Edmonton', moves: '3,876' },
    { name: 'Ottawa', moves: '3,654' },
  ];

  return (
    <section className="py-20 bg-gray-50" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Trusted by 50K+ Canadian Families
          </h2>
          <p className="text-xl text-gray-600">
            Real reviews from real customers who moved with Kesmoving.
          </p>
        </div>

        {/* Google Rating Badge */}
        <div className="flex justify-center mb-16">
          <div className="bg-white rounded-lg shadow-md p-8 inline-block">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-4xl font-bold text-gray-900">4.9</div>
                <p className="text-sm text-gray-600">out of 5 stars</p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Based on 2,847 Google Reviews</p>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{review.name}</h4>
                  <p className="text-sm text-gray-500">{review.location}</p>
                </div>
                {review.verified && (
                  <span className="bg-green-100 text-green-700 text-xs py-1 px-2 rounded">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-700 text-sm mb-4">{review.text}</p>
              <p className="text-xs text-gray-500">{review.date}</p>
            </div>
          ))}
        </div>

        {/* Coverage Map */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Service Across Canada
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {cities.map((city, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 text-center hover:border-blue-600 transition"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MapPinIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{city.name}</h4>
                </div>
                <p className="text-3xl font-bold text-blue-600">{city.moves}</p>
                <p className="text-sm text-gray-600">moves completed</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Trust Kesmoving with Your Move?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join our community of satisfied customers across Canada. Get your free AI-powered quote today.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            Get Your Free Quote Now →
          </button>
        </div>
      </div>
    </section>
  );
}
