import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Droplet, Shield, User, Heart, Hospital, Activity } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') || 'donor');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    blood_group: 'O+',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    organization_name: '',
    license_number: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...formData, role });
      switch (user.role) {
        case 'donor': navigate('/dashboard/donor'); break;
        case 'blood_bank': navigate('/dashboard/bloodbank'); break;
        case 'hospital': navigate('/dashboard/hospital'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '640px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '10px', 
          borderRadius: '12px', 
          background: 'var(--primary-light)', 
          color: 'var(--primary)',
          marginBottom: '1rem' 
        }}>
          <Droplet size={28} fill="currentColor" />
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Join CELLS Network</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Choose your stakeholder role to start saving lives
        </p>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', marginBottom: '1.5rem', padding: '0.85rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Role Selector Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'donor', label: 'Donor', icon: Heart },
          { id: 'requester', label: 'Requester', icon: Activity },
          { id: 'hospital', label: 'Hospital', icon: Hospital },
          { id: 'blood_bank', label: 'Blood Bank', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const active = role === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRole(tab.id)}
              style={{
                padding: '0.75rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background: active ? 'var(--primary-light)' : '#ffffff',
                color: active ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                name="full_name" 
                className="form-control" 
                placeholder="e.g. Ramesh Gupta" 
                required 
                value={formData.full_name} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input 
                type="tel" 
                name="phone" 
                className="form-control" 
                placeholder="+91-9876543210" 
                required 
                value={formData.phone} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input 
                type="email" 
                name="email" 
                className="form-control" 
                placeholder="ramesh@example.com" 
                required 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input 
                type="password" 
                name="password" 
                className="form-control" 
                placeholder="Minimum 6 characters" 
                required 
                value={formData.password} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Conditional Role Fields */}
          {role === 'donor' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                Donor Profile Specifications
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Blood Group *</label>
                  <select name="blood_group" className="form-control" value={formData.blood_group} onChange={handleChange}>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input type="text" name="city" className="form-control" required value={formData.city} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {(role === 'hospital' || role === 'blood_bank') && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                Institution Information (Subject to Admin Verification)
              </h4>
              <div className="form-group">
                <label className="form-label">Facility / Organization Name *</label>
                <input 
                  type="text" 
                  name="organization_name" 
                  className="form-control" 
                  placeholder={role === 'hospital' ? 'e.g. Apex Multispecialty Hospital' : 'e.g. Rotary Central Blood Bank'} 
                  required 
                  value={formData.organization_name} 
                  onChange={handleChange} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">State License / Registration No. *</label>
                  <input 
                    type="text" 
                    name="license_number" 
                    className="form-control" 
                    placeholder="e.g. LIC-2026-KA-991" 
                    required 
                    value={formData.license_number} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input type="text" name="city" className="form-control" required value={formData.city} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '1.25rem' }}
          >
            {loading ? 'Creating Account...' : `Register as ${role.toUpperCase().replace('_', ' ')}`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
