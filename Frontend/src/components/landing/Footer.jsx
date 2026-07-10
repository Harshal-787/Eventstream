import React from 'react';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-(--color-brutal-bg) border-t-4 border-(--color-brutal-border) pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-(--color-brutal-inverse-bg) flex items-center justify-center text-(--color-brutal-text-inverse) border-2 border-(--color-brutal-border) shadow-md">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-(--color-brutal-text) tracking-tighter uppercase">EventStream<span className="text-(--color-primary-600)">Go</span></span>
            </div>
            <p className="text-(--color-text-muted) text-sm leading-relaxed mb-6">
              The professional IoT event processing platform for smart commercial buildings and modern residential societies.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black text-(--color-brutal-text) tracking-widest uppercase mb-4">Platform</h3>
            <ul className="space-y-3 font-bold">
              <li><a href="#features" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Features</a></li>
              <li><a href="#use-cases" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Supported Sensors</a></li>
              <li><a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Analytics</a></li>
              <li><a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Alerts Engine</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black text-(--color-brutal-text) tracking-widest uppercase mb-4">Company</h3>
            <ul className="space-y-3 font-bold">
              <li><a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black text-(--color-brutal-text) tracking-widest uppercase mb-4">Portals</h3>
            <ul className="space-y-3 font-bold">
              <li><Link to="/login" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Customer Login</Link></li>
              <li><Link to="/login" className="text-sm text-(--color-text-muted) hover:text-(--color-brutal-text) hover:underline transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-(--color-brutal-border) pt-8 flex flex-col md:flex-row justify-between items-center font-bold">
          <p className="text-sm text-(--color-text-muted) mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} EventStream Go. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-primary-600)">Privacy Policy</a>
            <a href="#" className="text-sm text-(--color-text-muted) hover:text-(--color-primary-600)">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
