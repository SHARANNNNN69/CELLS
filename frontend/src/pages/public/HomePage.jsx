import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, AlertCircle, Heart, Shield, Activity, 
  MapPin, Droplet, ArrowRight, CheckCircle2, Info, Users, Clock 
} from 'lucide-react';
import api from '../../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [component, setComponent] = useState('Whole Blood');
  const [city, setCity] = useState('Bangalore');
  const [stats, setStats] = useState({
    banks: 3,
    units: 72,
    requests: 3
  });

  useEffect(() => {
    // Fetch live summary stats
    api.get('/analytics/dashboard').then(res => {
      if (res.success && res.data) {
        const totalUnits = res.data.stockByGroup?.reduce((acc, curr) => acc + Number(curr.units), 0) || 72;
        const totalReqs = res.data.requestsByUrgency?.reduce((acc, curr) => acc + Number(curr.count), 0) || 3;
        setStats(prev => ({
          ...prev,
          units: totalUnits,
          requests: totalReqs
        }));
      }
    }).catch(() => {});
  }, []);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    navigate(`/find-blood?blood_group=${encodeURIComponent(bloodGroup)}&component=${encodeURIComponent(component)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(180deg, #ffffff 0%, #fef2f2 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '3.5rem 0 4rem'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            border: '1px solid #fecaca'
          }}>
            <Activity size={14} /> CELLS — EMERGENCY BLOOD DISPATCH PROTOTYPE
          </div>

          <h1 style={{ 
            fontSize: '2.75rem', 
            fontWeight: 800, 
            letterSpacing: '-0.03em', 
            lineHeight: 1.15,
            marginBottom: '1rem',
            color: 'var(--text-main)'
          }}>
            Coordinating Life-Saving Blood Supply with Verified Safety.
          </h1>

          <p style={{ 
            fontSize: '1.1rem', 
            color: 'var(--text-muted)', 
            marginBottom: '2.5rem',
            lineHeight: 1.6
          }}>
            CELLS bridges hospitals, certified blood banks, and voluntary donors during critical emergencies. Featuring atomic stock tracking, quarantine audit trails, and rapid emergency dispatch.
          </p>

          {/* Quick Search Widget */}
          <div className="card" style={{ 
            padding: '1.75rem', 
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid #fed7aa',
            background: '#ffffff',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Search size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Search Real-Time Available Blood Stock</h3>
            </div>

            <form onSubmit={handleQuickSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Blood Group</label>
                <select 
                  className="form-control" 
                  value={bloodGroup} 
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
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
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="Packed Red Blood Cells (PRBC)">PRBC (Red Cells)</option>
                  <option value="Platelets">Platelets</option>
                  <option value="Fresh Frozen Plasma (FFP)">Fresh Frozen Plasma</option>
                  <option value="Cryoprecipitate">Cryoprecipitate</option>
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
                  Check Stock Availability
                </button>
              </div>
            </form>
          </div>

          {/* Emergency Call-To-Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <Link to="/emergency" className="btn btn-danger-emergency" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              <AlertCircle size={18} /> Post Emergency Blood Request
            </Link>
            <Link to="/donors" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              <Users size={18} /> Register as Voluntary Donor
            </Link>
          </div>
        </div>
      </section>

      {/* Live Platform Counter Stats */}
      <section style={{ padding: '2.5rem 0', background: '#ffffff', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.units}+</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tested Safe Blood Units</div>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>3</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Verified Regional Blood Banks</div>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent)' }}>{stats.requests}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Clinical Requests</div>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--success)' }}>100%</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Audited Batch Traceability</div>
            </div>
          </div>
        </div>
      </section>

      {/* How CELLS Works */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>How CELLS Handles Emergency Needs</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              A closed-loop coordination pipeline engineered for Software Engineering standards.
            </p>
          </div>

          <div className="grid-3">
            <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
              <div style={{ display: 'inline-flex', padding: '0.6rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', marginBottom: '1rem' }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>1. Triage & Requisition</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Requesters and hospital medical officers submit blood needs specifying blood group, component, unit count, and urgency tier (standard, urgent, emergency).
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
              <div style={{ display: 'inline-flex', padding: '0.6rem', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', marginBottom: '1rem' }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>2. Smart Dispatch & Alerts</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Immediate in-app broadcast triggers notifications to participating certified blood banks and opted-in voluntary donors in the matching geographical radius.
              </p>
            </div>

            <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
              <div style={{ display: 'inline-flex', padding: '0.6rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', marginBottom: '1rem' }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>3. Atomic Inventory Deduction</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Blood bank officers verify requisition, confirm physical cross-matching, and reserve/issue units through ACID-compliant database transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Medical Boundary Notice */}
      <section style={{ padding: '3rem 0', background: '#f1f5f9' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="card" style={{ borderLeft: '5px solid var(--warning)', background: '#fffbeb' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Info size={28} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#92400e', marginBottom: '0.4rem' }}>
                  Safety & Medical Protocol Boundaries
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#78350f', lineHeight: 1.6 }}>
                  CELLS is a coordination prototype and <strong>not a medical device</strong>. ABO/Rh filters and stock displays are for preliminary discovery only. In accordance with clinical transfusion regulations, physical blood grouping, antibody screening, component crossmatching, and release must always be conducted by qualified medical laboratory personnel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
