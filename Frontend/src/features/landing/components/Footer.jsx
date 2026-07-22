import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';

export function Footer() {
  return (
    <footer className="bg-primary-950 border-t border-primary-900 pt-16 pb-8 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Logo className="w-8 h-8" textClassName="text-white" />
            </div>
            <p className="text-primary-200 text-sm leading-relaxed mb-4">
              The professional IoT event processing platform for smart commercial buildings and modern residential societies.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary-50 tracking-wider uppercase mb-4">Platform</h3>
            <ul className="space-y-4">
              <li><a href="#features" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">Features</a></li>
              <li><a href="#use-cases" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">Supported Sensors</a></li>
              <li><a href="#" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">Analytics</a></li>
              <li><a href="#" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">Alerts Engine</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary-50 tracking-wider uppercase mb-4">Company</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">Customers</a></li>
              <li><a href="#" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">Newsroom</a></li>
              <li><a href="#" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">Events</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary-50 tracking-wider uppercase mb-4">Get in Touch</h3>
            <ul className="space-y-4">
              <li><Link to="/login" className="text-sm font-medium text-primary-200 hover:text-primary-400 transition-colors">hello@eventstream.com</Link></li>
              <li className="flex gap-4 pt-2">
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center">In</div>
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center">Tw</div>
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center">Fb</div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs sm:text-sm text-primary-300 font-medium mb-4 md:mb-0 text-center">
            &copy; {new Date().getFullYear()} EventStream Inc. All rights reserved.
          </p>
          <div className="flex space-x-4 sm:space-x-8">
            <a href="#" className="text-xs sm:text-sm font-medium text-primary-300 hover:text-primary-400 transition-colors">Terms & Conditions</a>
            <a href="#" className="text-xs sm:text-sm font-medium text-primary-300 hover:text-primary-400 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
