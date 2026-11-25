import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Phone, Clock, ShieldCheck, List, Map as MapIcon } from 'lucide-react';

export default function BloodBankMap({ bloodBanks = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        // Center around Bangalore default
        const map = L.map(mapContainerRef.current).setView([12.9716, 77.5946], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      const bounds = [];

      bloodBanks.forEach((bank) => {
        if (bank.latitude && bank.longitude) {
          const lat = parseFloat(bank.latitude);
          const lng = parseFloat(bank.longitude);
          bounds.push([lat, lng]);

          const marker = L.marker([lat, lng]).addTo(map);

          const popupContent = `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px;">
              <strong style="color: #b91c1c; font-size: 14px;">${bank.name}</strong><br/>
              <span style="color: #64748b;">${bank.address}, ${bank.city}</span><br/>
              <div style="margin-top: 6px; font-size: 12px;">
                <strong>Contact:</strong> ${bank.contact_phone}<br/>
                <strong>Hours:</strong> ${bank.operating_hours || '24/7'}<br/>
                <span style="color: #15803d; font-weight: 600;">✓ Tested Stock: ${bank.total_tested_units || 0} Units</span>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } catch (err) {
      console.warn('Map initialization error, falling back to list:', err);
      setMapError(true);
      setViewMode('list');
    }

    return () => {
      // Don't destroy map immediately on unmount to keep state smooth
    };
  }, [bloodBanks, viewMode]);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={18} color="var(--primary)" />
          Blood Bank Network Locations ({bloodBanks.length})
        </h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button 
            onClick={() => setViewMode('map')} 
            className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <MapIcon size={14} /> Map View
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <List size={14} /> List View
          </button>
        </div>
      </div>

      {viewMode === 'map' && !mapError ? (
        <div 
          ref={mapContainerRef} 
          style={{ 
            height: '420px', 
            width: '100%', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 1
          }} 
        />
      ) : (
        <div className="grid-3">
          {bloodBanks.map((bank) => (
            <div key={bank.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {bank.name}
                  </h4>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {bank.address}, {bank.city}, {bank.state} - {bank.pincode}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={13} color="var(--primary)" /> {bank.contact_phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={13} color="var(--text-muted)" /> {bank.operating_hours || '24/7 Service'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>License: {bank.license_number}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                  {bank.total_tested_units || 0} Units Tested
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
