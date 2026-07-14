import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';

export function Footer() {
  return (
    <footer className="bg-(--color-surface) border-t border-(--color-border-main) pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-1">
            <div className="mb-6">
              <Logo className="w-8 h-8" />
            </div>
            <p className="text-(--color-text-muted) text-sm leading-relaxed mb-6">
              The professional IoT event processing platform for smart commercial buildings and modern residential societies.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-(--color-text-main) tracking-wider uppercase mb-6">Platform</h3>
            <ul className="space-y-4">
              <li><a href="#features" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Features</a></li>
              <li><a href="#use-cases" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Supported Sensors</a></li>
              <li><a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Analytics</a></li>
              <li><a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Alerts Engine</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-(--color-text-main) tracking-wider uppercase mb-6">Company</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">About</a></li>
              <li><a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-(--color-text-main) tracking-wider uppercase mb-6">Portals</h3>
            <ul className="space-y-4">
              <li><Link to="/login" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Customer Login</Link></li>
              <li><Link to="/login" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-(--color-border-main) pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-(--color-text-muted) font-medium mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} EventStream Inc. All rights reserved.
          </p>
          <div className="flex space-x-8">
            <a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm font-medium text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
