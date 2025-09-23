// ~/crm_app/frontend_v2/crm-frontend-v2/src/components/AddressAutocomplete.jsx
import React, { useEffect, useRef, useState } from 'react';

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.defer = true;
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

function parsePlace(place) {
  const out = {
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  };
  try {
    const comp = place.address_components || [];
    const byType = (t) => comp.find(c => (c.types || []).includes(t));
    const street = byType('route')?.long_name || '';
    const number = byType('street_number')?.long_name || '';
    out.address_line1 = [number, street].filter(Boolean).join(' ').trim();

    out.city = byType('locality')?.long_name ||
               byType('sublocality')?.long_name ||
               byType('administrative_area_level_2')?.long_name || '';

    out.state = byType('administrative_area_level_1')?.short_name || '';
    out.postal_code = byType('postal_code')?.long_name || '';
    out.country = byType('country')?.long_name || '';

  } catch {}
  return out;
}

export default function AddressAutocomplete({ value, onSelect, placeholder = 'Start typing address…' }) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const inputRef = useRef(null);
  const [local, setLocal] = useState(value || '');

  useEffect(() => { setLocal(value || ''); }, [value]);

  useEffect(() => {
    let ac;
    let mounted = true;
    (async () => {
      if (!key) return; // sin API key, se queda como input normal
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        await loadScript(`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly`);
      }
      if (!mounted || !inputRef.current || !window.google?.maps?.places) return;
      ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['address_components', 'formatted_address'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const parsed = parsePlace(place);
        setLocal(place.formatted_address || parsed.address_line1 || '');
        onSelect && onSelect({ formatted: place.formatted_address, ...parsed });
      });
    })();
    return () => { mounted = false; };
  }, [key, onSelect]);

  return (
    <input
      ref={inputRef}
      className="input"
      placeholder={placeholder}
      value={local}
      onChange={(e)=>setLocal(e.target.value)}
    />
  );
}
