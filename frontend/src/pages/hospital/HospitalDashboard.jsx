import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Hospital, Activity, Clock, Plus, ShieldCheck, XCircle, ArrowRight } from 'lucide-react';

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, rRes] = await Promise.all([
        api.get('/hospitals/me'),
        api.get('/requests?my_requests=true')
      ]);
      if (hRes.success) setHospital(hRes.data);
      if (rRes.success) setRequests(rRes.data);
    } catch (err) {
      console.error('Failed to load hospital portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm(`Are you sure you want to cancel pending Requisition #${requestId}?`)) return;
    setCancelling(true);
    try {
      const res = await api.patch(`/requests/${requestId}/cancel`);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading hospital coordinator portal...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{hospital?.name || 'Hospital Coordinator Portal'}</h1>
            <StatusBadge type="verification" value={hospital?.verification_status || 'verified'} />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Authorized Medical Officer: {user?.full_name} | State License: <strong>{hospital?.license_number}</strong> | Request-Only Account
          </p>
        </div>

        <Link to="/emergency" className="btn btn-primary">
          <Plus size={16} /> New Clinical Requisition
        </Link>
      </div>

      {/* Hospital Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Submitted Requisitions
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>
            {requests.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tracked in hospital patient history
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Pending Blood Bank Review
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--warning)' }}>
            {requests.filter(r => r.status === 'pending').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Awaiting laboratory acceptance
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Fulfilled / Dispatched
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--success)' }}>
            {requests.filter(r => ['processing', 'dispatched', 'completed'].includes(r.status)).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Reserved or delivered to wards
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--primary)" /> Hospital Clinical Requisitions
          </h3>
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No blood requests currently logged under this hospital.
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
                  <th>Fulfilled</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Assigned Bank</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                    <td><span className="badge badge-standard">{r.blood_group}</span></td>
                    <td>{r.component}</td>
                    <td>
                      <strong style={{ color: r.units_fulfilled >= r.units_needed ? 'var(--success)' : 'inherit' }}>
                        {r.units_fulfilled}
                      </strong> / {r.units_needed}
                    </td>
                    <td><StatusBadge type="urgency" value={r.urgency} /></td>
                    <td>
                      <span className={`badge ${
                        r.status === 'pending' ? 'badge-quarantined' : 
                        r.status === 'accepted' ? 'badge-standard' : 
                        r.status === 'completed' ? 'badge-success' : 
                        r.status === 'rejected' ? 'badge-expired' : 'badge-standard'
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{r.assigned_blood_bank_name || 'Pending assignment'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <Link to={`/requests/${r.id}`} className="btn btn-secondary btn-sm">
                          Track
                        </Link>
                        {r.status === 'pending' && (
                          <button 
                            onClick={() => handleCancelRequest(r.id)} 
                            disabled={cancelling}
                            className="btn btn-sm btn-secondary" 
                            style={{ color: 'var(--danger)' }}
                            title="Cancel pending request"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
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
