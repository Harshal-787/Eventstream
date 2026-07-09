import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 border-b flex items-center ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-gray-200 shadow-sm' 
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="w-full flex justify-between items-center px-6">
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-(--color-primary-600) flex items-center justify-center text-white rounded-none">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">EventStream<span className="text-(--color-primary-600)">Go</span></span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
          <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-(--color-primary-600) transition-colors">Features</a>
          <a href="#use-cases" className="text-sm font-semibold text-gray-600 hover:text-(--color-primary-600) transition-colors">Supported Sensors</a>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="font-semibold rounded-none shadow-none">Start Free Trial</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button 
            className="text-gray-900 hover:text-(--color-primary-600) focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl">
          <div className="px-4 py-4 space-y-2 flex flex-col">
            <a href="#features" className="block py-2 text-sm font-bold text-gray-900 hover:text-(--color-primary-600)">Features</a>
            <a href="#use-cases" className="block py-2 text-sm font-bold text-gray-900 hover:text-(--color-primary-600)">Supported Sensors</a>
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col space-y-3">
              <Link to="/login" className="w-full">
                <Button variant="ghost" className="w-full justify-center rounded-none bg-gray-50 text-gray-900 border border-gray-200">Sign In</Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button className="w-full justify-center rounded-none">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
