import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Activity, Plus, Clock, ArrowRight } from 'lucide-react';

export default function RequesterDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchRequests();
  }, []);

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading your blood requests...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Blood Requisitions</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track response progress, blood bank offers, and fulfillment updates.
          </p>
        </div>

        <Link to="/emergency" className="btn btn-danger-emergency">
          <Plus size={16} /> New Request
        </Link>
      </div>

      <div className="card">
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
                  <th>Hospital</th>
                  <th>Fulfilled</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                    <td><span className="badge badge-standard">{r.blood_group}</span></td>
                    <td>{r.hospital_name_manual || r.hospital_name}</td>
                    <td>{r.units_fulfilled} / {r.units_needed}</td>
                    <td><StatusBadge type="urgency" value={r.urgency} /></td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>
                      <Link to={`/requests/${r.id}`} className="btn btn-secondary btn-sm">
                        Track Details
                      </Link>
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
