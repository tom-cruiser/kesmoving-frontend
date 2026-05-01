import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Phone, Mail, Zap, Truck } from 'lucide-react';
import QuoteForm from '../components/landing/QuoteForm';
import TrustRibbon from '../components/landing/TrustRibbon';
import AIInventorySection from '../components/landing/AIInventorySection';
import ServiceGrid from '../components/landing/ServiceGrid';
import TransparencySection from '../components/landing/TransparencySection';
import SocialProofGallery from '../components/landing/SocialProofGallery';

export default function LandingPage() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Kesmoving</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-gray-600 hover:text-gray-900 transition">Services</a>
              <a href="#why-us" className="text-gray-600 hover:text-gray-900 transition">Why Us</a>
              <a href="#reviews" className="text-gray-600 hover:text-gray-900 transition">Reviews</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition">Contact</a>
            </div>
            <Link 
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split Screen */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-50 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Headline and Value Props */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                  Moving Made <span className="text-blue-600">Reliable</span>.<br />
                  Trust the <span className="text-blue-600">Local Experts</span>.
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Canada's most trusted moving company. Professional, insured, and committed to getting your move right the first time.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-blue-600">50K+</div>
                  <p className="text-sm text-gray-600">Successful Moves</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-blue-600">4.9/5</div>
                  <p className="text-sm text-gray-600">Customer Rating</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-3xl font-bold text-blue-600">15+</div>
                  <p className="text-sm text-gray-600">Years Experience</p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Government Licensed Movers</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>100% WSIB Compliant Staff</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Full Insurance Protection</span>
                </div>
              </div>
            </div>

            {/* Right Side - Lead Capture Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Instant Quote</h2>
              <p className="text-gray-600 mb-6">Powered by AI. No credit card required.</p>
              <QuoteForm />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Ribbon */}
      <TrustRibbon />

      {/* AI Inventory Feature Section */}
      <AIInventorySection />

      {/* Services Grid */}
      <ServiceGrid />

      {/* Why Choose Us - Transparency Section */}
      <TransparencySection />

      {/* Social Proof Gallery */}
      <SocialProofGallery />

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Move?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of Canadians who trust Kesmoving for their relocations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition gap-2"
            >
              <Zap className="w-5 h-5" />
              Get Started Today
            </Link>
            <a 
              href="#contact"
              className="inline-flex items-center justify-center bg-blue-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition gap-2 border-2 border-white"
            >
              <Phone className="w-5 h-5" />
              Call Us: 1-800-KESMOVING
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Phone */}
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 mb-4">Mon-Fri 8am-6pm EST</p>
              <a href="tel:1-800-KESMOVING" className="text-blue-600 font-bold text-lg hover:text-blue-700">
                1-800-537-6648
              </a>
            </div>

            {/* Email */}
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 mb-4">We'll respond within 2 hours</p>
              <a href="mailto:info@kesmoving.ca" className="text-blue-600 font-bold text-lg hover:text-blue-700">
                info@kesmoving.ca
              </a>
            </div>

            {/* Live Chat */}
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with our team now</p>
              <button className="text-blue-600 font-bold text-lg hover:text-blue-700">
                Start Chat →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold text-white">Kesmoving</span>
              </div>
              <p className="text-sm">Canada's trusted moving partner since 2010.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Local Moving</a></li>
                <li><a href="#" className="hover:text-white transition">Long Distance</a></li>
                <li><a href="#" className="hover:text-white transition">Office Relocation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Kesmoving. All rights reserved. Government License #MOV-123456</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
