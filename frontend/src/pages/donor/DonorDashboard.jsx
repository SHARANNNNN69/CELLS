import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { Heart, Calendar, MapPin, Phone, ShieldCheck, CheckCircle2, Clock, HandHeart, Info } from 'lucide-react';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');

  // Express interest modal
  const [interestModal, setInterestModal] = useState({ open: false, request: null });
  const [interestNote, setInterestNote] = useState('');
  const [interestLoading, setInterestLoading] = useState(false);

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
      const [profRes, histRes, reqRes] = await Promise.all([
        api.get('/donors/me'),
        api.get('/donors/history'),
        api.get('/requests?status=pending')
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

      if (reqRes.success && reqRes.data) {
        setOpenRequests(reqRes.data);
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
        setMsg('Profile preferences updated successfully!');
        loadData();
      }
    } catch (err) {
      setMsg(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    if (!interestModal.request) return;
    setInterestLoading(true);
    try {
      const res = await api.post(`/requests/${interestModal.request.id}/donor-interest`, {
        availability_note: interestNote
      });
      if (res.success) {
        setInterestModal({ open: false, request: null });
        setInterestNote('');
        setMsg('Your willingness to donate has been recorded and communicated to the clinical team!');
      }
    } catch (err) {
      alert(err.message || 'Failed to submit willingness response');
    } finally {
      setInterestLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading donor portal...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Voluntary Donor Portal</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your availability status, review local donation opportunities, and inspect certified donation records.
        </p>
      </div>

      {msg && (
        <div className="card" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          {msg}
        </div>
      )}

      {/* Safety Notice */}
      <div className="card" style={{ background: '#fffbeb', borderLeft: '4px solid var(--warning)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Info size={22} color="#b45309" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
            <strong>Voluntary Donation Protocol:</strong> Expressing willingness to donate notifies the attending clinical team. It is not equivalent to a confirmed medical donation. Donor screening, hemoglobin evaluation, and donation completion must always be performed and recorded by authorized blood-bank personnel.
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 14px', borderRadius: 'var(--radius-sm)' }}>
              {profile?.blood_group || 'O+'}
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Voluntary Donor</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            Location: {profile?.city}, {profile?.state}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Donation Interval Status
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.4rem' }}>
            {formData.availability_status === 'available' ? '✓ Available for Donation' : 'Temporarily Unavailable'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Recorded Last Donation: {profile?.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : 'None recorded'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Verified Contributions
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>
            {history.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Donations certified by licensed blood banks
          </div>
        </div>
      </div>

      {/* Donation Opportunities */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HandHeart size={18} color="var(--primary)" /> Urgent Donation Opportunities Seeking Matching Volunteers
          </h3>
        </div>

        {openRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No pending patient requisitions currently requiring volunteer donor calls.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Req #</th>
                  <th>Patient</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Hospital</th>
                  <th>Urgency</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openRequests.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                    <td><span className="badge badge-standard">{r.blood_group}</span></td>
                    <td>{r.component}</td>
                    <td>{r.hospital_name_manual || r.hospital_name || r.city}</td>
                    <td><StatusBadge type="urgency" value={r.urgency} /></td>
                    <td>
                      <button 
                        onClick={() => {
                          setInterestNote(`I am an ${profile?.blood_group || 'O+'} donor available to donate upon clinical crossmatching.`);
                          setInterestModal({ open: true, request: r });
                        }}
                        className="btn btn-sm btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Heart size={13} /> Express Willingness
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Profile & Availability Form */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Update Donor Availability</h3>
        <form onSubmit={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <select 
                className="form-control" 
                value={formData.availability_status} 
                onChange={(e) => setFormData(prev => ({ ...prev, availability_status: e.target.value }))}
              >
                <option value="available">Available for Clinical Donation</option>
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
                <option value="in_app">In-App Alerts (Private)</option>
                <option value="phone">Direct Phone Call</option>
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
              <label className="form-label">City / Region</label>
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
              placeholder="e.g. Free on weekends; available for emergency replacement calls." 
              value={formData.notes} 
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
            />
          </div>

          <button type="submit" disabled={updating} className="btn btn-primary">
            {updating ? 'Saving Changes...' : 'Save Availability Preferences'}
          </button>
        </form>
      </div>

      {/* Verified Donation History */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          Certified Donation Log (Logged by Blood Banks)
        </h3>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No verified donations logged yet. When you complete a donation at an authorized blood bank, staff will certify and record it here.
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
                  <th>Medical Screening</th>
                </tr>
              </thead>
              <tbody>
                {history.map((d) => (
                  <tr key={d.id}>
                    <td>{new Date(d.donation_date).toLocaleDateString()}</td>
                    <td>{d.blood_bank_name} ({d.blood_bank_city})</td>
                    <td><span className="badge badge-standard">{d.blood_group}</span></td>
                    <td>{d.units_donated} Unit</td>
                    <td><span className="badge badge-success">Passed & Certified</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Express Willingness to Donate */}
      <Modal 
        isOpen={interestModal.open} 
        title={`Express Willingness to Donate (#${interestModal.request?.id})`} 
        onClose={() => setInterestModal({ open: false, request: null })}
      >
        <form onSubmit={handleInterestSubmit}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            You are offering volunteer donor availability for <strong>{interestModal.request?.blood_group} ({interestModal.request?.component})</strong> needed by <strong>{interestModal.request?.patient_name}</strong> at {interestModal.request?.hospital_name_manual || interestModal.request?.city}.
          </p>

          <div className="form-group">
            <label className="form-label">Availability / Scheduling Note *</label>
            <textarea 
              className="form-control" 
              rows="3" 
              placeholder="e.g. I am in Indiranagar and can visit the blood bank for screening within 2 hours." 
              required
              value={interestNote}
              onChange={(e) => setInterestNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setInterestModal({ open: false, request: null })} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={interestLoading} className="btn btn-primary">
              {interestLoading ? 'Submitting...' : 'Submit Willingness Response'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
