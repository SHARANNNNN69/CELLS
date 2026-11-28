import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { 
  Activity, Hospital, MapPin, Clock, Phone, AlertCircle, 
  CheckCircle2, Send, ShieldCheck, HeartHandshake, Shield,
  XCircle, Truck, PackageCheck, UserCheck, AlertTriangle
} from 'lucide-react';

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [donorInterestModalOpen, setDonorInterestModalOpen] = useState(false);
  const [donorNotes, setDonorNotes] = useState('');
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [deductUnits, setDeductUnits] = useState(1);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/requests/${id}`);
      if (res.success && res.data) {
        setRequest(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Load available tested batches when opening fulfillment modal
  const openFulfillModal = async () => {
    setFulfillModalOpen(true);
    try {
      const res = await api.get('/inventory');
      if (res.success && res.data) {
        const safeBatches = res.data.filter(b => 
          b.status === 'tested_safe' && 
          new Date(b.expiry_date) >= new Date() && 
          b.units_available > 0
        );
        setAvailableBatches(safeBatches);
        if (safeBatches.length > 0) {
          setSelectedBatchId(safeBatches[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load inventory for fulfillment:', err);
    }
  };

  // BLOOD BANK WORKFLOW ACTIONS
  const handleAccept = async () => {
    if (!window.confirm('Accept this clinical blood requisition for processing at your blood bank?')) return;
    setSubmittingAction(true);
    try {
      const res = await api.patch(`/requests/${id}/accept`);
      if (res.success) {
        setActionSuccess('Requisition accepted! You can now prepare components and allocate stock.');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept requisition');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await api.patch(`/requests/${id}/reject`, { reason: rejectionReason });
      if (res.success) {
        setRejectModalOpen(false);
        setActionSuccess('Requisition has been formally rejected.');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to reject requisition');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleProcess = async () => {
    setSubmittingAction(true);
    try {
      const res = await api.patch(`/requests/${id}/process`, {
        stage: 'Crossmatching & Unit Reservation'
      });
      if (res.success) {
        setActionSuccess('Status updated: Units reserved and processing for crossmatch.');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to update processing status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDispatch = async () => {
    setSubmittingAction(true);
    try {
      const res = await api.patch(`/requests/${id}/dispatch`, {
        notes: 'Dispatched via certified cold-chain medical transport vehicle.'
      });
      if (res.success) {
        setActionSuccess('Units marked as dispatched and en route to the destination hospital.');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to dispatch units');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await api.patch(`/requests/${id}/fulfill`, {
        batch_id: selectedBatchId,
        units_to_deduct: Number(deductUnits)
      });
      if (res.success) {
        setFulfillModalOpen(false);
        setActionSuccess('Fulfillment verified! Inventory atomically deducted and audit log created.');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Fulfillment transaction failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  // HOSPITAL / REQUESTER CANCELLATION
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this requisition? This action cannot be reversed.')) return;
    setSubmittingAction(true);
    try {
      const res = await api.patch(`/requests/${id}/cancel`);
      if (res.success) {
        setActionSuccess('Requisition has been cancelled.');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel requisition');
    } finally {
      setSubmittingAction(false);
    }
  };

  // DONOR INTEREST PLEDGE
  const handleDonorInterestSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await api.post(`/requests/${id}/donor-interest`, { notes: donorNotes });
      if (res.success) {
        setDonorInterestModalOpen(false);
        setActionSuccess('Thank you! Your willingness to donate has been logged. The blood bank will contact you for screening.');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to express donation interest');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading requisition details...</div>;
  }

  if (error || !request) {
    return (
      <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 700 }}>{error || 'Request not found.'}</p>
        <Link to="/requests" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Requests</Link>
      </div>
    );
  }

  const isBankStaff = user && (user.role === 'blood_bank' || user.role === 'admin');
  const isOwner = user && (request.requester_id === user.id);
  const isDonor = user && (user.role === 'donor');
  const status = (request.status || 'pending').toLowerCase();

  // Workflow steps
  const steps = [
    { key: 'pending', label: '1. Pending Review' },
    { key: 'accepted', label: '2. Accepted' },
    { key: 'processing', label: '3. Stock Reserved' },
    { key: 'dispatched', label: '4. Dispatched' },
    { key: 'completed', label: '5. Completed' }
  ];

  const getStepIndex = (st) => {
    if (st === 'pending') return 0;
    if (st === 'accepted') return 1;
    if (st === 'processing') return 2;
    if (st === 'dispatched') return 3;
    if (st === 'completed' || st === 'fulfilled') return 4;
    return -1;
  };

  const currentStepIdx = getStepIndex(status);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '960px' }}>
      {/* Alert Banner */}
      {actionSuccess && (
        <div className="card" style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '1.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 12px', borderRadius: 'var(--radius-sm)' }}>
              {request.blood_group}
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Requisition #{request.id}</h1>
            <StatusBadge type="urgency" value={request.urgency} />
            <StatusBadge value={request.status} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Submitted on {new Date(request.created_at).toLocaleString()} by <strong>{request.requester_name}</strong> ({request.requester_role || 'requester'})
          </p>
        </div>

        {/* Dynamic RBAC Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Blood Bank actions */}
          {isBankStaff && status === 'pending' && (
            <>
              <button onClick={handleAccept} disabled={submittingAction} className="btn btn-primary" style={{ background: 'var(--success)' }}>
                <CheckCircle2 size={16} /> Accept Requisition
              </button>
              <button onClick={() => setRejectModalOpen(true)} disabled={submittingAction} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                <XCircle size={16} /> Reject
              </button>
            </>
          )}

          {isBankStaff && status === 'accepted' && (
            <button onClick={handleProcess} disabled={submittingAction} className="btn btn-primary" style={{ background: '#d97706' }}>
              <PackageCheck size={16} /> Mark Processing (Reserve Stock)
            </button>
          )}

          {isBankStaff && status === 'processing' && (
            <button onClick={handleDispatch} disabled={submittingAction} className="btn btn-primary" style={{ background: '#2563eb' }}>
              <Truck size={16} /> Dispatch Units
            </button>
          )}

          {isBankStaff && (status === 'dispatched' || status === 'processing') && (
            <button onClick={openFulfillModal} disabled={submittingAction} className="btn btn-primary" style={{ background: 'var(--success)' }}>
              <ShieldCheck size={16} /> Record Issue & Complete
            </button>
          )}

          {/* Hospital / Requester owner actions */}
          {isOwner && status === 'pending' && (
            <button onClick={handleCancel} disabled={submittingAction} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              <XCircle size={16} /> Cancel Pending Requisition
            </button>
          )}

          {/* Donor actions */}
          {isDonor && status !== 'completed' && status !== 'cancelled' && status !== 'rejected' && (
            <button onClick={() => setDonorInterestModalOpen(true)} className="btn btn-primary">
              <HeartHandshake size={16} /> Express Willingness to Donate
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Workflow Stepper */}
      {status !== 'rejected' && status !== 'cancelled' ? (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Clinical Fulfillment Workflow
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {steps.map((s, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={s.key} style={{
                  padding: '0.6rem 0.3rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isCurrent ? 'var(--primary)' : isPast ? '#dcfce7' : '#f1f5f9',
                  color: isCurrent ? '#fff' : isPast ? '#166534' : 'var(--text-muted)',
                  fontWeight: isCurrent || isPast ? 700 : 500,
                  fontSize: '0.8rem',
                  border: isCurrent ? '1px solid var(--primary)' : '1px solid transparent'
                }}>
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '2rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 700 }}>
            <AlertTriangle size={18} />
            Requisition {status.toUpperCase()}
          </div>
          {request.rejection_reason && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#7f1d1d' }}>
              <strong>Reason:</strong> {request.rejection_reason}
            </div>
          )}
        </div>
      )}

      {/* Main Info Grid */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Patient & Clinical Need
          </h4>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>{request.patient_name}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Component: <strong>{request.component}</strong>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Units Needed: <strong>{request.units_needed}</strong> (Fulfilled: <span style={{ color: 'var(--success)' }}>{request.units_fulfilled || 0}</span>)
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Destination Hospital
          </h4>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            {request.hospital_name_manual || request.hospital_name || 'Hospital unspecified'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            {request.delivery_address}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
            Location: {request.city}, {request.state}
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Contact & Required Time
          </h4>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} /> Needed by: {new Date(request.required_by).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Phone size={14} color="var(--primary)" /> {request.contact_phone}
          </div>
        </div>
      </div>

      {request.notes && (
        <div className="card" style={{ marginBottom: '2rem', background: '#f8fafc' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>Clinical Case Description</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{request.notes}</p>
        </div>
      )}

      {/* Assigned Blood Bank & Clinical Tracking */}
      {request.assigned_blood_bank_name && (
        <div className="card" style={{ marginBottom: '2rem', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} /> Assigned Regional Blood Bank
          </h4>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>
            {request.assigned_blood_bank_name}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginTop: '0.2rem' }}>
            Fulfilment Stage: <strong>{request.processing_stage || 'Under review and inventory validation'}</strong>
          </div>
        </div>
      )}

      {/* VOLUNTARY DONOR INTEREST SECTION (Per Prompt Section 6: Donors separate workflow) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HeartHandshake size={18} color="var(--primary)" /> 
            Voluntary Donor Responses ({request.donorInterests?.length || 0})
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
            Donor Pledges ≠ Confirmed Donation
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Registered donors who expressed willingness to donate for this requisition. Official donation screening, viral testing and intake must be completed by authorized blood bank personnel.
        </p>

        {(!request.donorInterests || request.donorInterests.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No voluntary donor pledges recorded yet. Donors with blood group <strong>{request.blood_group}</strong> have been notified.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {request.donorInterests.map(interest => (
              <div key={interest.id} style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserCheck size={16} color="var(--primary)" />
                    {interest.donor_name}
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                      {interest.donor_blood_group || request.blood_group}
                    </span>
                  </div>
                  {interest.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      "{interest.notes}"
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Pledged: {new Date(interest.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Reject Requisition (Blood Bank) */}
      <Modal isOpen={rejectModalOpen} title="Reject Blood Requisition" onClose={() => setRejectModalOpen(false)}>
        <form onSubmit={handleReject}>
          <div className="form-group">
            <label className="form-label">Reason for Rejection *</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Insufficient quarantined units available; non-matching crossmatch sample; or referral to alternative apex regional facility."
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setRejectModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submittingAction} className="btn btn-danger">
              {submittingAction ? 'Processing...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Express Donor Willingness (Donor) */}
      <Modal isOpen={donorInterestModalOpen} title="Express Willingness to Donate" onClose={() => setDonorInterestModalOpen(false)}>
        <form onSubmit={handleDonorInterestSubmit}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            By submitting this pledge, you express willingness to donate blood for Requisition #{request.id} ({request.blood_group}).
            The blood bank will coordinate directly with you for clinical screening.
          </p>
          <div className="form-group">
            <label className="form-label">Availability / Notes for Blood Bank</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Available today after 2 PM at Metro Central blood bank. Last donation was 4 months ago."
              value={donorNotes}
              onChange={(e) => setDonorNotes(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setDonorInterestModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submittingAction} className="btn btn-primary">
              {submittingAction ? 'Submitting Pledge...' : 'Confirm Willingness'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Atomic Inventory Fulfillment (Blood Bank Staff) */}
      <Modal isOpen={fulfillModalOpen} title="Issue & Deduct Units from Tested Batch" onClose={() => setFulfillModalOpen(false)}>
        <form onSubmit={handleFulfillSubmit}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select an approved, non-quarantined batch from your blood bank to atomically issue and reserve units with full audit trail logging.
          </p>

          <div className="form-group">
            <label className="form-label">Available Tested Batch</label>
            {availableBatches.length === 0 ? (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                No active 'tested_safe' batches with available stock found in your blood bank.
              </div>
            ) : (
              <select 
                className="form-control" 
                value={selectedBatchId} 
                onChange={(e) => setSelectedBatchId(e.target.value)}
              >
                {availableBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    Batch #{b.batch_number} — {b.blood_group} ({b.component}) — {b.units_available} units avail (Exp: {b.expiry_date.slice(0,10)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Units to Issue</label>
            <input 
              type="number" 
              className="form-control" 
              min="1" 
              max={Math.max(1, request.units_needed - (request.units_fulfilled || 0))}
              required
              value={deductUnits}
              onChange={(e) => setDeductUnits(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setFulfillModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submittingAction || availableBatches.length === 0} 
              className="btn btn-primary"
              style={{ background: 'var(--success)' }}
            >
              {submittingAction ? 'Executing Transaction...' : 'Confirm Atomic Deduction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
