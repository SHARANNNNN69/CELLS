import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, AlertCircle, Shield, CheckCircle2, Clock, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DonorsSearchPage() {
  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (bloodGroup) query.append('blood_group', bloodGroup);
      if (city) query.append('city', city);

      const res = await api.get(`/donors?${query.toString()}`);
      if (res.success && res.data) {
        setDonors(res.data.donors || []);
      }
    } catch (err) {
      console.error('Failed to load donors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [bloodGroup, city]);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Voluntary Potential Donor Registry
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Preliminary leads of voluntary donors available for emergency donation camps and replacement donations.
        </p>
      </div>

      {/* Prominent Safety & Eligibility Disclaimer */}
      <div className="card" style={{ background: '#fffbeb', borderLeft: '4px solid var(--warning)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={22} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
            <strong>Important Safety Notice:</strong> Self-reported availability does not establish clinical donor eligibility or transfusion compatibility. All potential donors must undergo medical screening, hemoglobin evaluation, and infectious disease testing conducted by authorized blood bank staff prior to donation.
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchDonors(); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Blood Group Filter</label>
            <select className="form-control" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">City / Region</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Bangalore" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
              <Search size={16} /> Search Potential Donors
            </button>
          </div>
        </form>
      </div>

      {/* Donors List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Retrieving registered voluntary donor leads...
        </div>
      ) : (
        <div className="grid-3">
          {donors.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontWeight: 600 }}>No voluntary donors found for the specified filters.</p>
              <Link to="/register?role=donor" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                Register as a Donor
              </Link>
            </div>
          ) : (
            donors.map((donor) => (
              <div key={donor.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 800, 
                      color: 'var(--primary)', 
                      background: 'var(--primary-light)', 
                      padding: '2px 10px', 
                      borderRadius: 'var(--radius-sm)' 
                    }}>
                      {donor.blood_group}
                    </span>
                    <span className="badge badge-success">
                      {donor.availability_status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    {donor.masked_name}
                  </h4>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    <MapPin size={14} color="var(--primary)" />
                    {donor.city}, {donor.state}
                  </div>

                  <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '0.6rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                    <div><strong>Last Donation:</strong> {donor.last_donation_date || 'No recent record'}</div>
                    <div style={{ marginTop: '0.2rem', color: donor.informational_interval_eligible ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                      {donor.informational_interval_eligible ? '✓ Informational 90-day interval satisfied' : '⚠ Interval under 90 days'}
                    </div>
                  </div>

                  {donor.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                      "{donor.notes}"
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Prefers: {donor.contact_preference}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Shield size={12} /> Contact Masked
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
