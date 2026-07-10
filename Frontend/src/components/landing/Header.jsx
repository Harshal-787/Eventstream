import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

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
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 border-b-4 flex items-center ${
        scrolled 
          ? 'bg-(--color-brutal-bg)/90 backdrop-blur-md border-(--color-brutal-border) shadow-md' 
          : 'bg-(--color-brutal-bg) border-(--color-brutal-border)'
      }`}
    >
      <div className="w-full flex justify-between items-center px-6">
        
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-(--color-brutal-inverse-bg) flex items-center justify-center text-(--color-brutal-text-inverse) border-2 border-(--color-brutal-border) shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-(--color-brutal-text) tracking-tighter uppercase">EventStream<span className="text-(--color-primary-600)">Go</span></span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
          <a href="#features" className="text-xs font-black uppercase tracking-widest text-(--color-text-muted) hover:text-(--color-brutal-text) transition-colors">Features</a>
          <a href="#use-cases" className="text-xs font-black uppercase tracking-widest text-(--color-text-muted) hover:text-(--color-brutal-text) transition-colors">Supported Sensors</a>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="secondary" size="sm" className="font-bold">SIGN IN</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="font-bold">START FREE TRIAL</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <ThemeToggle />
          <button 
            className="text-(--color-brutal-text) hover:text-(--color-primary-600) focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-(--color-brutal-bg) border-b-4 border-(--color-brutal-border) shadow-md">
          <div className="px-4 py-4 space-y-2 flex flex-col">
            <a href="#features" className="block py-3 text-xs font-black tracking-widest uppercase text-(--color-text-muted) hover:text-(--color-brutal-text)">Features</a>
            <a href="#use-cases" className="block py-3 text-xs font-black tracking-widest uppercase text-(--color-text-muted) hover:text-(--color-brutal-text)">Supported Sensors</a>
            <div className="mt-4 pt-4 border-t-2 border-(--color-brutal-border) flex flex-col space-y-3">
              <Link to="/login" className="w-full">
                <Button variant="secondary" className="w-full justify-center">SIGN IN</Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button className="w-full justify-center">START FREE TRIAL</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
