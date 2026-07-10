import React, { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { MapPin } from 'lucide-react';
import apiClient from '../../services/apiClient';

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelectAddress, 
  placeholder = "Start typing building address...",
  required = false
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Debounce API calls
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/address/autocomplete?q=${encodeURIComponent(value)}`);
        if (res.data && res.data.results) {
          setSuggestions(res.data.results);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Address autocomplete error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    // Call the parent handler with the parsed address data
    onSelectAddress({
      address_line1: item.address_line1 || item.name || item.street || "",
      city: item.city || item.county || "",
      state: item.state || "",
      zip_code: item.postcode || "",
      country: item.country || "",
      formatted: item.formatted || "",
      lat: item.lat || null,
      lon: item.lon || null
    });

    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-(--color-primary-500) border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-(--color-border-main) rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {suggestions.map((item, index) => (
              <li 
                key={index}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 hover:bg-(--color-surface-hover) cursor-pointer flex items-start text-sm text-(--color-text-main) border-b border-(--color-border-main) last:border-0"
              >
                <MapPin className="w-4 h-4 text-(--color-text-muted) mr-2 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium block">{item.address_line1 || item.name}</span>
                  <span className="text-xs text-(--color-text-muted)">{item.address_line2 || `${item.city}, ${item.state}`}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
