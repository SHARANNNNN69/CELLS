import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Activity, Plus, Clock, ArrowRight, XCircle } from 'lucide-react';

export default function RequesterDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests?my_requests=true');
      if (res.success) setRequests(res.data);
    } catch (err) {
      console.error('Failed to load my requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm(`Are you sure you want to cancel your pending Requisition #${requestId}?`)) return;
    setCancelling(true);
    try {
      const res = await api.patch(`/requests/${requestId}/cancel`);
      if (res.success) {
        fetchRequests();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading your blood requests...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Patient & Requester Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Logged in as {user?.full_name} | Track blood bank acceptance, dispatch progress, and fulfillment.
          </p>
        </div>

        <Link to="/emergency" className="btn btn-danger-emergency">
          <Plus size={16} /> New Emergency Request
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--primary)" /> My Submitted Blood Requisitions
          </h3>
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>You have not posted any blood requests yet.</p>
            <Link to="/emergency" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create Requisition
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Req #</th>
                  <th>Patient</th>
                  <th>Blood Group</th>
                  <th>Hospital / Destination</th>
                  <th>Fulfilled</th>
                  <th>Urgency</th>
                  <th>Processing Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                    <td><span className="badge badge-standard">{r.blood_group}</span></td>
                    <td>{r.hospital_name_manual || r.hospital_name || r.delivery_address}</td>
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
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <Link to={`/requests/${r.id}`} className="btn btn-secondary btn-sm">
                          Track Details
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
