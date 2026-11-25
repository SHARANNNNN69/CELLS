import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Activity, Search, Clock, MapPin, Hospital, ArrowRight } from 'lucide-react';

export default function RequestsListPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgency, setUrgency] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (urgency) query.append('urgency', urgency);
      if (bloodGroup) query.append('blood_group', bloodGroup);
      if (status) query.append('status', status);

      const res = await api.get(`/requests?${query.toString()}`);
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load blood requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [urgency, bloodGroup, status]);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Live Blood Requisitions
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real-time feed of open clinical requests from hospitals and emergency patients.
          </p>
        </div>

        <Link to="/emergency" className="btn btn-danger-emergency">
          + Create Requisition
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter Urgency</label>
            <select className="form-control" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
              <option value="">All Urgencies</option>
              <option value="emergency">🚨 Emergency (0-6h)</option>
              <option value="urgent">⏰ Urgent (24h)</option>
              <option value="standard">📅 Standard</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter Blood Group</label>
            <select className="form-control" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter Status</label>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="partially_fulfilled">Partially Fulfilled</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading active blood requisitions...
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontWeight: 600 }}>No requests match the selected filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="card" 
              style={{ 
                borderLeft: `5px solid ${req.urgency === 'emergency' ? 'var(--danger)' : req.urgency === 'urgent' ? '#ea580c' : 'var(--accent)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {req.blood_group}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {req.component} ({req.units_needed} Units Required)
                  </span>
                  <StatusBadge type="urgency" value={req.urgency} />
                  <StatusBadge value={req.status} />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Hospital size={14} /> {req.hospital_name_manual || req.hospital_name || 'Hospital unspecified'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} /> {req.city}, {req.state}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> Needed by: {new Date(req.required_by).toLocaleString()}
                  </span>
                </div>

                {req.notes && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    "{req.notes}"
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    Fulfilled: <span style={{ color: 'var(--success)' }}>{req.units_fulfilled}</span> / {req.units_needed}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Posted by: {req.requester_name}
                  </div>
                </div>

                <Link to={`/requests/${req.id}`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  View Details <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
