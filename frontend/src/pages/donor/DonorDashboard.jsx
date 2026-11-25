import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Heart, Calendar, MapPin, Phone, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');

  const [formData, setFormData] = useState({
    availability_status: 'available',
    contact_preference: 'in_app',
    city: '',
    state: '',
    pincode: '',
    last_donation_date: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, histRes] = await Promise.all([
        api.get('/donors/me'),
        api.get('/donors/history')
      ]);

      if (profRes.success && profRes.data) {
        setProfile(profRes.data);
        setFormData({
          availability_status: profRes.data.availability_status || 'available',
          contact_preference: profRes.data.contact_preference || 'in_app',
          city: profRes.data.city || '',
          state: profRes.data.state || '',
          pincode: profRes.data.pincode || '',
          last_donation_date: profRes.data.last_donation_date ? profRes.data.last_donation_date.slice(0, 10) : '',
          notes: profRes.data.notes || ''
        });
      }

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    } catch (err) {
      console.error('Failed to load donor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMsg('');
    try {
      const res = await api.put('/donors/me', formData);
      if (res.success) {
        setMsg('Profile updated successfully!');
        loadData();
      }
    } catch (err) {
      setMsg(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading donor portal...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Donor Self-Service Portal</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your availability, donation records, and emergency contact preferences.
        </p>
      </div>

      {msg && (
        <div className="card" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          {msg}
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {/* Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 14px', borderRadius: 'var(--radius-sm)' }}>
              {profile?.blood_group || 'O+'}
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Donor</div>
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Phone:</strong> {user?.phone}</div>
            <div><strong>Location:</strong> {profile?.city}, {profile?.state}</div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className={`badge ${profile?.availability_status === 'available' ? 'badge-success' : 'badge-standard'}`}>
                Status: {profile?.availability_status}
              </span>
            </div>
          </div>
        </div>

        {/* Donation Reminders */}
        <div className="card" style={{ background: '#f8fafc' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={18} color="var(--primary)" /> Donation Interval Tracker
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
            National guidelines recommend a minimum 90-day interval between whole blood donations for donor health and iron recovery.
          </p>
          <div style={{ padding: '0.75rem', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recorded Last Donation:</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {profile?.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : 'No recorded date'}
            </div>
          </div>
        </div>

        {/* Total Donations Stats */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Heart size={18} color="var(--primary)" /> Recorded Contributions
          </h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: '0.5rem 0' }}>
            {history.length}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total verified donations logged in network.
          </div>
        </div>
      </div>

      {/* Edit Preferences Form */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Update Donor Settings</h3>
        <form onSubmit={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <select 
                className="form-control" 
                value={formData.availability_status} 
                onChange={(e) => setFormData(prev => ({ ...prev, availability_status: e.target.value }))}
              >
                <option value="available">Available for Donation</option>
                <option value="unavailable">Temporarily Unavailable</option>
                <option value="recently_donated">Recently Donated (&lt; 90 days)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Preference</label>
              <select 
                className="form-control" 
                value={formData.contact_preference} 
                onChange={(e) => setFormData(prev => ({ ...prev, contact_preference: e.target.value }))}
              >
                <option value="in_app">In-App Notifications (Private)</option>
                <option value="phone">Phone Calls Allowed</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Last Donation Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={formData.last_donation_date} 
                onChange={(e) => setFormData(prev => ({ ...prev, last_donation_date: e.target.value }))} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.city} 
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Personal Availability Notes</label>
            <textarea 
              className="form-control" 
              rows="2" 
              placeholder="e.g. Can donate on weekends; prefer calls after 5 PM." 
              value={formData.notes} 
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
            />
          </div>

          <button type="submit" disabled={updating} className="btn btn-primary">
            {updating ? 'Saving Changes...' : 'Save Profile Preferences'}
          </button>
        </form>
      </div>

      {/* Donation History Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Donation Log</h3>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No donation visits logged yet. Donations recorded at participating blood banks will appear here.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Blood Bank</th>
                  <th>Group</th>
                  <th>Units</th>
                  <th>Screening</th>
                </tr>
              </thead>
              <tbody>
                {history.map((d) => (
                  <tr key={d.id}>
                    <td>{new Date(d.donation_date).toLocaleDateString()}</td>
                    <td>{d.blood_bank_name} ({d.blood_bank_city})</td>
                    <td><span className="badge badge-standard">{d.blood_group}</span></td>
                    <td>{d.units_donated} Unit</td>
                    <td><span className="badge badge-success">Passed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
