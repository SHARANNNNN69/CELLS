import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { Shield, Plus, AlertCircle, CheckCircle2, History, Archive, Droplet } from 'lucide-react';

export default function BloodBankDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBatchModal, setNewBatchModal] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, batch: null });
  const [newStatus, setNewStatus] = useState('tested_safe');

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
      const [bRes, aRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/audit-logs')
      ]);

      if (bRes.success) setBatches(bRes.data);
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

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading blood bank inventory console...</div>;

  const totalTestedUnits = batches
    .filter(b => b.status === 'tested_safe' && new Date(b.expiry_date) >= new Date())
    .reduce((sum, b) => sum + Number(b.units_available), 0);

  const quarantinedCount = batches.filter(b => b.status === 'quarantined').length;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Blood Bank Inventory Console</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Batch testing, release verification, and audited inventory control.
          </p>
        </div>

        <button onClick={() => setNewBatchModal(true)} className="btn btn-primary">
          <Plus size={16} /> Log New Blood Batch
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Ready & Tested Safe Units
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--success)' }}>
            {totalTestedUnits}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Available for immediate requisition issue
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Quarantined Testing Batches
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--warning)' }}>
            {quarantinedCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Pending infectious disease & viral screening
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Total Managed Batches
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {batches.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tracked with immutable audit transactions
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Droplet size={18} color="var(--primary)" /> Inventory Batches & Screening Status
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

      {/* Audit Log Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={18} color="var(--primary)" /> Traceable Inventory Transactions Log
          </h3>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Batch #</th>
                <th>Units Change</th>
                <th>Type</th>
                <th>Reason / Requisition</th>
                <th>Officer</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 15).map((log) => (
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
              <label className="form-label">Initial Units Available *</label>
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
