import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Shield, Users, CheckCircle2, XCircle, History, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState({ hospitals: [], bloodBanks: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications', 'users', 'logs'
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, uRes, vRes, aRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/users'),
        api.get('/admin/verifications'),
        api.get('/admin/audit-logs')
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (uRes.success) setUsers(uRes.data);
      if (vRes.success) setVerifications(vRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerification = async (type, id, status) => {
    try {
      const res = await api.patch(`/admin/verifications/${type}/${id}`, { status });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, {
        is_active: !currentStatus
      });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading super admin console...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Super Administrator Console</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Platform governance, institutional credential verification, user management, and security audit trail.
        </p>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Platform Users</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{metrics?.users || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Verified Blood Banks</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{metrics?.verifiedBanks || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Clinical Requisitions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>{metrics?.totalRequests || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Tested Units in Pool</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{metrics?.availableTestedUnits || 0}</div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('verifications')} 
          className={`btn btn-sm ${activeTab === 'verifications' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Pending Verifications ({verifications.hospitals.length + verifications.bloodBanks.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          User Accounts ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('logs')} 
          className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Platform Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: Pending Verifications */}
      {activeTab === 'verifications' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
            Pending Institutional License Verifications
          </h3>
          {verifications.hospitals.length === 0 && verifications.bloodBanks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No pending institutional verification submissions. All registered hospitals and blood banks are evaluated.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {verifications.bloodBanks.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>🩸 Blood Bank: {b.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      License: <strong>{b.license_number}</strong> | City: {b.city} | Contact: {b.contact_phone}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleVerification('blood_bank', b.id, 'verified')} className="btn btn-primary btn-sm" style={{ background: 'var(--success)' }}>
                      Approve & Verify
                    </button>
                    <button onClick={() => handleVerification('blood_bank', b.id, 'rejected')} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {verifications.hospitals.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>🏥 Hospital: {h.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      License: <strong>{h.license_number}</strong> | City: {h.city} | Contact: {h.contact_phone}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleVerification('hospital', h.id, 'verified')} className="btn btn-primary btn-sm" style={{ background: 'var(--success)' }}>
                      Approve & Verify
                    </button>
                    <button onClick={() => handleVerification('hospital', h.id, 'rejected')} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Users Management */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Registered Users</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td><span className="badge badge-standard">{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-expired'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleToggleUser(u.id, u.is_active)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: u.is_active ? 'var(--danger)' : 'var(--success)' }}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Global Audit Trail */}
      {activeTab === 'logs' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Security & Audit Trail</h3>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td><span className="badge badge-standard">{log.action}</span></td>
                    <td>{log.entity_type} #{log.entity_id || ''}</td>
                    <td>{log.user_name || 'System'} ({log.user_role || 'sys'})</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(log.details_json)}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
