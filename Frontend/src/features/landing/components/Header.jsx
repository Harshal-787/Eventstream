import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { Menu, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { Logo } from '../../../components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';

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
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 flex items-center border-b',
        scrolled 
          ? 'bg-(--color-surface) border-(--color-border-main) shadow-sm' 
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center px-6">
        
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <Logo className="w-8 h-8" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-semibold text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Platform Features</a>
          <a href="#use-cases" className="text-sm font-semibold text-(--color-text-muted) hover:text-(--color-primary-600) transition-colors">Sensor Integrations</a>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" className="font-semibold text-(--color-text-muted) hover:text-(--color-primary-600)">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button className="font-bold rounded-xl shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all">Start Free Trial</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <ThemeToggle />
          <button 
            className="text-(--color-text-main) hover:text-(--color-primary-600) focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-20 left-0 w-full bg-(--color-surface) border-b border-(--color-border-main) shadow-lg"
          >
            <div className="px-6 py-6 space-y-4 flex flex-col">
              <a href="#features" className="block py-2 text-sm font-semibold text-(--color-text-main) hover:text-(--color-primary-600)">Platform Features</a>
              <a href="#use-cases" className="block py-2 text-sm font-semibold text-(--color-text-main) hover:text-(--color-primary-600)">Sensor Integrations</a>
              <div className="pt-6 border-t border-(--color-border-main) flex flex-col space-y-3">
                <Link to="/login" className="w-full">
                  <Button variant="secondary" className="w-full justify-center rounded-xl">Sign In</Button>
                </Link>
                <Link to="/register" className="w-full">
                  <Button className="w-full justify-center rounded-xl">Start Free Trial</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
