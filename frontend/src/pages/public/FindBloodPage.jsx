import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import BloodBankMap from '../../components/BloodBankMap';
import { Search, MapPin, Phone, ShieldCheck, AlertCircle, Droplet } from 'lucide-react';

export default function FindBloodPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bloodGroup, setBloodGroup] = useState(searchParams.get('blood_group') || '');
  const [component, setComponent] = useState(searchParams.get('component') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (bloodGroup) query.append('blood_group', bloodGroup);
      if (component) query.append('component', component);
      if (city) query.append('city', city);

      const res = await api.get(`/bloodbanks?${query.toString()}`);
      if (res.success && res.data) {
        setBanks(res.data.banks || []);
      }
    } catch (err) {
      console.error('Failed to load blood banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, [bloodGroup, component, city]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchBanks();
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Find Blood Stock & Certified Banks
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Search real-time tested inventory across registered regional blood banks. Only safe, unexpired, and non-quarantined units are reported.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Blood Group</label>
            <select 
              className="form-control"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              <option value="">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Component</label>
            <select 
              className="form-control"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
            >
              <option value="">All Components</option>
              <option value="Whole Blood">Whole Blood</option>
              <option value="Packed Red Blood Cells (PRBC)">Packed Red Blood Cells (PRBC)</option>
              <option value="Platelets">Platelets</option>
              <option value="Fresh Frozen Plasma (FFP)">Fresh Frozen Plasma (FFP)</option>
              <option value="Cryoprecipitate">Cryoprecipitate</option>
            </select>
          </div>

          <div>
            <label className="form-label">City / District</label>
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
              <Search size={16} /> Filter Results
            </button>
          </div>
        </form>
      </div>

      {/* Map View & List View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading certified blood bank network...
        </div>
      ) : (
        <>
          <BloodBankMap bloodBanks={banks} />

          {/* Detailed Banks List */}
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
              Detailed Bank Inventories
            </h3>

            {banks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <AlertCircle size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600 }}>No blood banks found matching the selected filters.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try resetting the blood group or city filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {banks.map((bank) => (
                  <div key={bank.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{bank.name}</h4>
                        <span className="badge badge-success">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <MapPin size={14} color="var(--primary)" />
                        <span>{bank.address}, {bank.city}, {bank.state} ({bank.pincode})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <span><strong>Phone:</strong> {bank.contact_phone}</span>
                        <span><strong>License:</strong> {bank.license_number}</span>
                        <span><strong>Service:</strong> {bank.operating_hours || '24/7'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {bank.total_tested_units || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Tested Units Ready
                        </div>
                      </div>

                      <Link 
                        to={`/emergency?hospital_name_manual=${encodeURIComponent(bank.name)}&blood_group=${encodeURIComponent(bloodGroup || 'O+')}`}
                        className="btn btn-primary btn-sm"
                      >
                        Request Units
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
