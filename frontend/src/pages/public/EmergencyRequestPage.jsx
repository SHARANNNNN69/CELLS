import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AlertCircle, Clock, ShieldCheck, Heart, Send, CheckCircle2 } from 'lucide-react';

export default function EmergencyRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    patient_name: '',
    hospital_name_manual: searchParams.get('hospital_name_manual') || '',
    blood_group: searchParams.get('blood_group') || 'O+',
    component: 'Whole Blood',
    units_needed: 2,
    urgency: 'urgent',
    required_by: '',
    contact_phone: user?.phone || '',
    delivery_address: '',
    city: 'Bangalore',
    state: 'Karnataka',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default required_by to 24 hours in future
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const formatted = tomorrow.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, required_by: formatted }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Please sign in or create an account to post and track an official blood requisition.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/requests', formData);
      if (res.success && res.data) {
        setSuccess('Blood requisition successfully created! Alert dispatched to regional banks and donors.');
        setTimeout(() => {
          navigate(`/requests/${res.data.id}`);
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          background: '#fee2e2', 
          color: '#991b1b', 
          padding: '0.3rem 0.8rem', 
          borderRadius: '9999px', 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          marginBottom: '0.75rem' 
        }}>
          <AlertCircle size={14} /> CLINICAL BLOOD DISPATCH DESK
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Create Blood Requisition</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Broadcast your urgent blood requirement to participating certified blood banks and registered voluntary donors.
        </p>
      </div>

      {!user && (
        <div className="card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#0369a1' }}>
            <strong>Notice:</strong> You need an authenticated session to post a verifiable blood request and receive live response updates.
          </div>
          <Link to="/login" className="btn btn-primary btn-sm">
            Sign In Now
          </Link>
        </div>
      )}

      {error && (
        <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', marginBottom: '1.5rem', padding: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="card" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '1.5rem', padding: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Urgency Selector */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Urgency Classification</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <label style={{
                border: `2px solid ${formData.urgency === 'emergency' ? 'var(--danger)' : 'var(--border)'}`,
                background: formData.urgency === 'emergency' ? '#fef2f2' : '#fff',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'center'
              }}>
                <input 
                  type="radio" 
                  name="urgency" 
                  value="emergency" 
                  checked={formData.urgency === 'emergency'} 
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>🚨 Emergency</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 - 6 Hours (Critical)</div>
              </label>

              <label style={{
                border: `2px solid ${formData.urgency === 'urgent' ? '#ea580c' : 'var(--border)'}`,
                background: formData.urgency === 'urgent' ? '#fff7ed' : '#fff',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'center'
              }}>
                <input 
                  type="radio" 
                  name="urgency" 
                  value="urgent" 
                  checked={formData.urgency === 'urgent'} 
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '0.9rem' }}>⏰ Urgent</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Within 24 Hours</div>
              </label>

              <label style={{
                border: `2px solid ${formData.urgency === 'standard' ? 'var(--accent)' : 'var(--border)'}`,
                background: formData.urgency === 'standard' ? '#eff6ff' : '#fff',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'center'
              }}>
                <input 
                  type="radio" 
                  name="urgency" 
                  value="standard" 
                  checked={formData.urgency === 'standard'} 
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>📅 Standard</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled Surgery</div>
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Patient Full Name *</label>
              <input 
                type="text" 
                name="patient_name"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                required
                value={formData.patient_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hospital / Medical Center *</label>
              <input 
                type="text" 
                name="hospital_name_manual"
                className="form-control"
                placeholder="e.g. CityCare Multispecialty Hospital"
                required
                value={formData.hospital_name_manual}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Blood Group *</label>
              <select name="blood_group" className="form-control" value={formData.blood_group} onChange={handleChange}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Component *</label>
              <select name="component" className="form-control" value={formData.component} onChange={handleChange}>
                <option value="Whole Blood">Whole Blood</option>
                <option value="Packed Red Blood Cells (PRBC)">PRBC (Red Cells)</option>
                <option value="Platelets">Platelets</option>
                <option value="Fresh Frozen Plasma (FFP)">Fresh Frozen Plasma</option>
                <option value="Cryoprecipitate">Cryoprecipitate</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Units Needed *</label>
              <input 
                type="number" 
                name="units_needed" 
                className="form-control" 
                min="1" 
                max="20" 
                required 
                value={formData.units_needed} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Required By (Date & Time) *</label>
              <input 
                type="datetime-local" 
                name="required_by"
                className="form-control"
                required
                value={formData.required_by}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone *</label>
              <input 
                type="tel" 
                name="contact_phone"
                className="form-control"
                placeholder="+91-9876543210"
                required
                value={formData.contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Ward / Exact Location *</label>
            <input 
              type="text" 
              name="delivery_address"
              className="form-control"
              placeholder="e.g. ICU Resuscitation Bay 2, 2nd Floor"
              required
              value={formData.delivery_address}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input 
                type="text" 
                name="city"
                className="form-control"
                required
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">State *</label>
              <input 
                type="text" 
                name="state"
                className="form-control"
                required
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Notes / Diagnosis / Reason</label>
            <textarea 
              name="notes"
              className="form-control"
              rows="3"
              placeholder="e.g. Road accident trauma, planned cardiopulmonary bypass, or platelet count drop below 20k."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            {loading ? 'Submitting & Dispatching Notifications...' : 'Publish Blood Requisition'}
          </button>
        </form>
      </div>
    </div>
  );
}
