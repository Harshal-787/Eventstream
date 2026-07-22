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
    <header className={cn("fixed top-0 left-0 w-full z-50 h-28 flex items-center transition-colors duration-300", scrolled ? "bg-white/90 dark:bg-surface/90 backdrop-blur-lg shadow-sm border-b border-border-main" : "bg-transparent")}>
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center px-6">
        
        {/* Logo (Flex-1 ensures it takes equal space as right side) */}
        <div className="flex-1 flex justify-start">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo className="w-10 h-10 transition-transform group-hover:scale-105" />
          </Link>
        </div>

        {/* Desktop Navigation & Theme Toggle (Exactly Centered) */}
        <nav className="hidden md:flex items-center space-x-10 shrink-0">
          <a href="#" className="text-sm font-bold text-text-main hover:text-primary-600 transition-colors">Home</a>
          <a href="#product" className="text-sm font-bold text-text-main hover:text-primary-600 transition-colors">Product</a>
          <a href="#integrations" className="text-sm font-bold text-text-main hover:text-primary-600 transition-colors">Integrations</a>
          <a href="#pricing" className="text-sm font-bold text-text-main hover:text-primary-600 transition-colors">Pricing</a>
          <div className="pl-2 border-l border-border-main">
            <ThemeToggle />
          </div>
        </nav>

        {/* Auth Buttons (Flex-1 ensures it balances the left side) */}
        <div className="hidden md:flex flex-1 justify-end items-center">
          <Link to="/register">
            <Button className="font-bold text-sm px-8 py-2 rounded-full bg-primary-950 text-white hover:bg-primary-800 transition-all">
              Sign Up
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <ThemeToggle />
          <button 
            className="text-text-main hover:text-primary-600 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
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
            className="md:hidden absolute top-28 left-0 w-full bg-surface border-b border-border-main shadow-2xl"
          >
            <div className="px-6 py-8 space-y-6 flex flex-col">
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-text-main hover:text-primary-600">Home</a>
              <a href="#product" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-text-main hover:text-primary-600">Product</a>
              <a href="#integrations" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-text-main hover:text-primary-600">Integrations</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-lg font-bold text-text-main hover:text-primary-600">Pricing</a>
              <div className="pt-8 border-t border-border-main flex flex-col">
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button className="w-full justify-center rounded-full py-6 text-lg bg-primary-950 text-white">Get Started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
