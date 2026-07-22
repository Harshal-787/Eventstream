import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Cpu, User, X, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setResults(data || []);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, token]);

  const handleSelect = (item) => {
    onClose();
    if (item.type === 'device') {
      navigate(`/${user?.role}/devices`);
    } else if (item.type === 'building') {
      navigate(`/${user?.role}/buildings`);
    } else if (item.type === 'user' && user?.role === 'admin') {
      navigate(`/admin/users`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'building': return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'device': return <Cpu className="w-5 h-5 text-emerald-500" />;
      case 'user': return <User className="w-5 h-5 text-teal-500" />;
      default: return <Search className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-surface rounded-2xl shadow-2xl overflow-hidden z-[101] border border-border-main"
          >
            <div className="flex items-center px-4 py-4 border-b border-border-main">
              <Search className="w-5 h-5 text-text-muted mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search buildings, devices, users..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-text-main placeholder:text-text-muted"
              />
              <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:bg-slate-100 dark:hover:bg-surface-hover transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {isLoading && (
                <div className="p-4 text-center text-sm text-text-muted">Searching...</div>
              )}
              
              {!isLoading && query && results.length === 0 && (
                <div className="p-8 text-center text-text-muted">
                  <p className="text-sm font-medium">No results found for "{query}"</p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <ul className="space-y-1">
                  {results.map((res, i) => (
                    <li key={`${res.type}-${res.id}-${i}`}>
                      <button
                        onClick={() => handleSelect(res)}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-surface-hover transition-colors text-left"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                          {getIcon(res.type)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-text-main">{res.name}</div>
                          <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{res.description}</div>
                        </div>
                        <div className="ml-auto text-[10px] font-bold tracking-wider uppercase text-text-muted bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {res.type}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              {!query && (
                <div className="p-8 text-center flex flex-col items-center justify-center text-text-muted">
                  <Command className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Type to start searching globally</p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-border-main bg-slate-50 dark:bg-surface-hover/50 flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Use <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-border-main font-mono mx-1">↑</kbd> <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-border-main font-mono mx-1">↓</kbd> to navigate</span>
              <span><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-border-main font-mono mx-1">esc</kbd> to close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
