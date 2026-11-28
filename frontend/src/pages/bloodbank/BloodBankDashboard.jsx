import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { 
  Shield, Plus, AlertCircle, CheckCircle2, XCircle, History, 
  Archive, Droplet, Clock, Hospital, Truck, CheckCheck, Send 
} from 'lucide-react';

export default function BloodBankDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'inventory', 'history'
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [newBatchModal, setNewBatchModal] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, batch: null });
  const [newStatus, setNewStatus] = useState('tested_safe');
  const [rejectModal, setRejectModal] = useState({ open: false, request: null });
  const [rejectReason, setRejectReason] = useState('');
  const [fulfillModal, setFulfillModal] = useState({ open: false, request: null });
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [deductUnits, setDeductUnits] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    batch_number: '',
    blood_group: 'O+',
    component: 'Whole Blood',
    units_available: 5,
    collection_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    status: 'quarantined',
    storage_location: 'Cold Storage Vault 1'
  });

  // Calculate default expiry: 35 days for Whole Blood
  useEffect(() => {
    const exp = new Date();
    exp.setDate(exp.getDate() + 35);
    setFormData(prev => ({
      ...prev,
      batch_number: `BATCH-${Date.now().toString().slice(-6)}`,
      expiry_date: exp.toISOString().slice(0, 10)
    }));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, rRes, aRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/requests?my_requests=true'),
        api.get('/inventory/audit-logs')
      ]);

      if (bRes.success) setBatches(bRes.data);
      if (rRes.success) setRequests(rRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error('Failed to load blood bank data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers ---
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory', formData);
      if (res.success) {
        setNewBatchModal(false);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create batch');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModal.batch) return;
    try {
      const res = await api.patch(`/inventory/${statusModal.batch.id}`, {
        status: newStatus
      });
      if (res.success) {
        setStatusModal({ open: false, batch: null });
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/requests/${requestId}/accept`);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.request) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/requests/${rejectModal.request.id}/reject`, {
        reason: rejectReason
      });
      if (res.success) {
        setRejectModal({ open: false, request: null });
        setRejectReason('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/requests/${requestId}/process`);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update processing stage');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchRequest = async (requestId) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/requests/${requestId}/dispatch`);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to mark as dispatched');
    } finally {
      setActionLoading(false);
    }
  };

  const openFulfillModalForReq = (req) => {
    // Filter tested_safe batches
    const safeBatches = batches.filter(b => 
      b.status === 'tested_safe' && 
      new Date(b.expiry_date) >= new Date() && 
      b.units_available > 0
    );
    setSelectedBatchId(safeBatches.length ? safeBatches[0].id : '');
    setDeductUnits(Math.max(1, req.units_needed - req.units_fulfilled));
    setFulfillModal({ open: true, request: req });
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!fulfillModal.request) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/requests/${fulfillModal.request.id}/fulfill`, {
        batch_id: selectedBatchId,
        units_to_deduct: Number(deductUnits)
      });
      if (res.success) {
        setFulfillModal({ open: false, request: null });
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Atomic fulfillment failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading blood bank console...</div>;

  const totalTestedUnits = batches
    .filter(b => b.status === 'tested_safe' && new Date(b.expiry_date) >= new Date())
    .reduce((sum, b) => sum + Number(b.units_available), 0);

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Blood Bank Management Console</h1>
            <span className="badge badge-success">Staff Operational Hub</span>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Authorized laboratory personnel: {user?.full_name} | Manage inventory batches, verify requisitions & dispatch blood.
          </p>
        </div>

        <button onClick={() => setNewBatchModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Blood Stock Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Tested Safe Stock Units
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--success)' }}>
            {totalTestedUnits}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Available for immediate clinical fulfillment
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Incoming Pending Requisitions
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: pendingRequests.length > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
            {pendingRequests.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Awaiting authorized laboratory review
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Active Monitored Batches
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {batches.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Protected with atomic row-level locking
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('requests')} 
          className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Incoming Requisitions ({requests.length}) {pendingRequests.length > 0 && `• ${pendingRequests.length} Pending`}
        </button>
        <button 
          onClick={() => setActiveTab('inventory')} 
          className={`btn btn-sm ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Inventory & Component Batches ({batches.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Issue & Dispatch Audit Ledger ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: Incoming Requisitions & Processing Workflow */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--primary)" /> Incoming Clinical Requisitions & Workflow Control
            </h3>
          </div>

          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No active clinical requisitions found for this regional blood bank.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requests.map((r) => (
                <div 
                  key={r.id} 
                  style={{ 
                    border: '1px solid var(--border)', 
                    borderLeft: `5px solid ${r.status === 'pending' ? 'var(--warning)' : r.status === 'accepted' ? 'var(--accent)' : r.status === 'completed' ? 'var(--success)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                          {r.blood_group}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                          Requisition #{r.id} — {r.patient_name}
                        </span>
                        <StatusBadge type="urgency" value={r.urgency} />
                        <span className={`badge ${
                          r.status === 'pending' ? 'badge-quarantined' : 
                          r.status === 'accepted' ? 'badge-standard' : 
                          r.status === 'completed' ? 'badge-success' : 
                          r.status === 'rejected' ? 'badge-expired' : 'badge-standard'
                        }`}>
                          Status: {r.status.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                        <span>Component: <strong>{r.component}</strong></span>
                        <span>Needed: <strong>{r.units_needed} Units</strong></span>
                        <span>Fulfilled: <strong style={{ color: 'var(--success)' }}>{r.units_fulfilled} Units</strong></span>
                        <span>Destination: <strong>{r.hospital_name_manual || r.hospital_name || r.delivery_address}</strong></span>
                        <span>Contact: <strong>{r.contact_phone}</strong></span>
                      </div>
                    </div>

                    <Link to={`/requests/${r.id}`} className="btn btn-secondary btn-sm">
                      Inspect Requisition
                    </Link>
                  </div>

                  {/* Operational Action Buttons per Section 1 & 6 */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {r.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleAcceptRequest(r.id)} 
                          disabled={actionLoading}
                          className="btn btn-sm btn-primary"
                          style={{ background: 'var(--success)' }}
                        >
                          <CheckCircle2 size={14} /> Accept Request
                        </button>
                        <button 
                          onClick={() => setRejectModal({ open: true, request: r })} 
                          disabled={actionLoading}
                          className="btn btn-sm btn-secondary"
                          style={{ color: 'var(--danger)' }}
                        >
                          <XCircle size={14} /> Reject Request
                        </button>
                      </>
                    )}

                    {r.status === 'accepted' && (
                      <>
                        <button 
                          onClick={() => handleProcessRequest(r.id)} 
                          disabled={actionLoading}
                          className="btn btn-sm btn-primary"
                        >
                          <Clock size={14} /> Mark as Processing (Reserve Stock)
                        </button>
                        <button 
                          onClick={() => openFulfillModalForReq(r)} 
                          disabled={actionLoading}
                          className="btn btn-sm btn-primary"
                          style={{ background: 'var(--success)' }}
                        >
                          <CheckCheck size={14} /> Issue & Fulfill from Tested Batch
                        </button>
                      </>
                    )}

                    {r.status === 'processing' && (
                      <>
                        <button 
                          onClick={() => handleDispatchRequest(r.id)} 
                          disabled={actionLoading}
                          className="btn btn-sm btn-primary"
                          style={{ background: '#0284c7' }}
                        >
                          <Truck size={14} /> Dispatch Blood Units
                        </button>
                        <button 
                          onClick={() => openFulfillModalForReq(r)} 
                          disabled={actionLoading}
                          className="btn btn-sm btn-primary"
                          style={{ background: 'var(--success)' }}
                        >
                          <CheckCheck size={14} /> Record Fulfillment Complete
                        </button>
                      </>
                    )}

                    {r.status === 'dispatched' && (
                      <button 
                        onClick={() => openFulfillModalForReq(r)} 
                        disabled={actionLoading}
                        className="btn btn-sm btn-primary"
                        style={{ background: 'var(--success)' }}
                      >
                        <CheckCheck size={14} /> Mark Requisition Completed
                      </button>
                    )}

                    {r.status === 'completed' && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={15} /> Operational Fulfillment Logged & Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Inventory Batches */}
      {activeTab === 'inventory' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Droplet size={18} color="var(--primary)" /> Inventory Batches, Quarantine & Testing Status
            </h3>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Batch #</th>
                  <th>Group</th>
                  <th>Component</th>
                  <th>Units Avail</th>
                  <th>Collection</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{b.batch_number}</td>
                    <td><span className="badge badge-standard">{b.blood_group}</span></td>
                    <td>{b.component}</td>
                    <td style={{ fontWeight: 700 }}>{b.units_available}</td>
                    <td>{b.collection_date.slice(0, 10)}</td>
                    <td>
                      {b.expiry_date.slice(0, 10)}{' '}
                      {b.days_until_expiry < 5 && b.days_until_expiry >= 0 && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700 }}>(Expiring soon)</span>
                      )}
                    </td>
                    <td><StatusBadge type="batch" value={b.status} /></td>
                    <td>
                      <button 
                        onClick={() => {
                          setNewStatus(b.status);
                          setStatusModal({ open: true, batch: b });
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Issue & Dispatch History Audit Ledger */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={18} color="var(--primary)" /> Immutable Inventory Audit Transactions
            </h3>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Batch #</th>
                  <th>Delta Units</th>
                  <th>Type</th>
                  <th>Reason / Order Reference</th>
                  <th>Authorized Officer</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{log.batch_number}</td>
                    <td style={{ fontWeight: 700, color: log.change_units > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {log.change_units > 0 ? `+${log.change_units}` : log.change_units}
                    </td>
                    <td><span className="badge badge-standard">{log.transaction_type}</span></td>
                    <td>{log.reason}</td>
                    <td style={{ fontSize: '0.8rem' }}>{log.performed_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Log New Batch */}
      <Modal isOpen={newBatchModal} title="Log New Blood Batch" onClose={() => setNewBatchModal(false)}>
        <form onSubmit={handleCreateBatch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Batch Number *</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={formData.batch_number} 
                onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group *</label>
              <select 
                className="form-control" 
                value={formData.blood_group} 
                onChange={(e) => setFormData(prev => ({ ...prev, blood_group: e.target.value }))}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Component</label>
              <select 
                className="form-control" 
                value={formData.component} 
                onChange={(e) => setFormData(prev => ({ ...prev, component: e.target.value }))}
              >
                <option value="Whole Blood">Whole Blood</option>
                <option value="Packed Red Blood Cells (PRBC)">PRBC (Red Cells)</option>
                <option value="Platelets">Platelets</option>
                <option value="Fresh Frozen Plasma (FFP)">Fresh Frozen Plasma</option>
                <option value="Cryoprecipitate">Cryoprecipitate</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Units Available *</label>
              <input 
                type="number" 
                className="form-control" 
                min="1" 
                required 
                value={formData.units_available} 
                onChange={(e) => setFormData(prev => ({ ...prev, units_available: Number(e.target.value) }))} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Collection Date *</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={formData.collection_date} 
                onChange={(e) => setFormData(prev => ({ ...prev, collection_date: e.target.value }))} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date *</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={formData.expiry_date} 
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select 
              className="form-control" 
              value={formData.status} 
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="quarantined">Quarantined (Default until tested)</option>
              <option value="tested_safe">Tested & Safe</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setNewBatchModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log & Save Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reject Request with reason */}
      <Modal isOpen={rejectModal.open} title="Reject Blood Requisition" onClose={() => setRejectModal({ open: false, request: null })}>
        <form onSubmit={handleRejectSubmit}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Provide the clinical or inventory reason for declining Requisition #{rejectModal.request?.id} ({rejectModal.request?.patient_name}):
          </p>

          <div className="form-group">
            <label className="form-label">Rejection Reason *</label>
            <textarea 
              className="form-control" 
              rows="3" 
              placeholder="e.g. Incompatible crossmatch, current stock reserved for trauma center, or insufficient units in required ABO group."
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setRejectModal({ open: false, request: null })} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: 'var(--danger)' }}>
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Fulfill Request from Batch */}
      <Modal isOpen={fulfillModal.open} title={`Fulfill Requisition #${fulfillModal.request?.id}`} onClose={() => setFulfillModal({ open: false, request: null })}>
        <form onSubmit={handleFulfillSubmit}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select an approved batch from your blood bank to atomically deduct and issue units for patient {fulfillModal.request?.patient_name}:
          </p>

          <div className="form-group">
            <label className="form-label">Available Tested Batch</label>
            <select 
              className="form-control" 
              value={selectedBatchId} 
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              {batches.filter(b => b.status === 'tested_safe' && b.units_available > 0).map(b => (
                <option key={b.id} value={b.id}>
                  Batch #{b.batch_number} — {b.blood_group} ({b.component}) — {b.units_available} units avail (Exp: {b.expiry_date.slice(0,10)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Units to Issue</label>
            <input 
              type="number" 
              className="form-control" 
              min="1" 
              max={fulfillModal.request?.units_needed || 1}
              required
              value={deductUnits}
              onChange={(e) => setDeductUnits(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setFulfillModal({ open: false, request: null })} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={actionLoading || !selectedBatchId} className="btn btn-primary" style={{ background: 'var(--success)' }}>
              Execute Atomic Deduction
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Update Batch Status */}
      <Modal 
        isOpen={statusModal.open} 
        title={`Update Batch ${statusModal.batch?.batch_number} Status`} 
        onClose={() => setStatusModal({ open: false, batch: null })}
      >
        <form onSubmit={handleUpdateStatus}>
          <div className="form-group">
            <label className="form-label">Select Testing / Quality Status</label>
            <select 
              className="form-control" 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="quarantined">Quarantined (Under laboratory testing)</option>
              <option value="tested_safe">Tested & Safe (Released for requisition)</option>
              <option value="rejected">Rejected (Failed infectious disease screening)</option>
              <option value="expired">Expired</option>
              <option value="depleted">Depleted</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setStatusModal({ open: false, batch: null })} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Apply Status Change
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
