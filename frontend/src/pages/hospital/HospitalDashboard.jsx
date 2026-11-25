import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Hospital, Activity, Clock, Plus, ShieldCheck } from 'lucide-react';

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchData();
  }, []);

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
            Representative: {user?.full_name} ({hospital?.designation || 'Medical Officer'}) | License: {hospital?.license_number}
          </p>
        </div>

        <Link to="/emergency" className="btn btn-primary">
          <Plus size={16} /> New Clinical Requisition
        </Link>
      </div>

      {/* Requests Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--primary)" /> Clinical Blood Requisitions ({requests.length})
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
                  <th>Req ID</th>
                  <th>Patient</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Units Fulfilled</th>
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
                    <td>{r.component}</td>
                    <td>{r.units_fulfilled} / {r.units_needed}</td>
                    <td><StatusBadge type="urgency" value={r.urgency} /></td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>
                      <Link to={`/requests/${r.id}`} className="btn btn-secondary btn-sm">
                        View Responses
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
