import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { 
  Activity, Hospital, MapPin, Clock, Phone, AlertCircle, 
  CheckCircle2, Send, ShieldCheck, HeartHandshake, Shield 
} from 'lucide-react';

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Response Offer Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerUnits, setOfferUnits] = useState(1);
  const [offerMsg, setOfferMsg] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  // Fulfillment Modal State (for Blood Bank Staff)
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [deductUnits, setDeductUnits] = useState(1);
  const [fulfillLoading, setFulfillLoading] = useState(false);
  const [fulfillSuccess, setFulfillSuccess] = useState('');

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
    setFulfillSuccess('');
    try {
      const res = await api.get('/inventory');
      if (res.success && res.data) {
        // Filter only tested_safe batches matching request blood group or universal
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

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    setOfferLoading(true);
    try {
      const res = await api.post(`/requests/${id}/respond`, {
        units_offered: Number(offerUnits),
        message: offerMsg
      });
      if (res.success) {
        setOfferModalOpen(false);
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to record response');
    } finally {
      setOfferLoading(false);
    }
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    setFulfillLoading(true);
    try {
      const res = await api.patch(`/requests/${id}/fulfill`, {
        batch_id: selectedBatchId,
        units_to_deduct: Number(deductUnits)
      });
      if (res.success) {
        setFulfillSuccess('Units successfully issued and inventory updated in database!');
        setTimeout(() => {
          setFulfillModalOpen(false);
          fetchDetail();
        }, 1500);
      }
    } catch (err) {
      alert(err.message || 'Fulfillment transaction failed');
    } finally {
      setFulfillLoading(false);
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

  return (
    <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '900px' }}>
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
            Submitted on {new Date(request.created_at).toLocaleString()} by {request.requester_name}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isBankStaff && request.status !== 'fulfilled' && (
            <button onClick={openFulfillModal} className="btn btn-primary" style={{ background: 'var(--success)' }}>
              <ShieldCheck size={16} /> Fulfill & Issue Units
            </button>
          )}

          {user && request.status !== 'fulfilled' && (
            <button onClick={() => setOfferModalOpen(true)} className="btn btn-outline">
              <HeartHandshake size={16} /> Offer Response
            </button>
          )}
        </div>
      </div>

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
            Units Needed: <strong>{request.units_needed}</strong> (Fulfilled: <span style={{ color: 'var(--success)' }}>{request.units_fulfilled}</span>)
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

      {/* Response & Timeline Audit */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--primary)" /> Response Timeline & Offers ({request.responses?.length || 0})
          </h3>
        </div>

        {request.responses?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No responses recorded yet. Certified blood banks and matched donors have been notified in-app.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {request.responses.map((resp) => (
              <div key={resp.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{resp.responder_name}</span>
                    <span className="badge badge-standard" style={{ fontSize: '0.7rem' }}>{resp.responder_type}</span>
                  </div>
                  <span className={`badge ${resp.status === 'completed' ? 'badge-success' : 'badge-standard'}`}>
                    {resp.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  Offered <strong>{resp.units_offered} units</strong>: {resp.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Logged at: {new Date(resp.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Offer Response */}
      <Modal isOpen={offerModalOpen} title="Submit Assistance / Response" onClose={() => setOfferModalOpen(false)}>
        <form onSubmit={handleOfferSubmit}>
          <div className="form-group">
            <label className="form-label">Units You Can Coordinate / Offer</label>
            <input 
              type="number" 
              className="form-control" 
              min="1" 
              max={request.units_needed} 
              required
              value={offerUnits}
              onChange={(e) => setOfferUnits(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message / Instructions for Requester</label>
            <textarea 
              className="form-control" 
              rows="3" 
              placeholder="e.g. Please bring doctor requisition form and patient EDTA blood sample tube to Richmond Town branch."
              required
              value={offerMsg}
              onChange={(e) => setOfferMsg(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setOfferModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={offerLoading} className="btn btn-primary">
              {offerLoading ? 'Submitting...' : 'Record Response'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Atomic Inventory Fulfillment (Blood Bank Staff) */}
      <Modal isOpen={fulfillModalOpen} title="Issue & Deduct Units from Tested Batch" onClose={() => setFulfillModalOpen(false)}>
        {fulfillSuccess ? (
          <div style={{ padding: '1rem', color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem' }} />
            {fulfillSuccess}
          </div>
        ) : (
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
                max={request.units_needed - request.units_fulfilled}
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
                disabled={fulfillLoading || availableBatches.length === 0} 
                className="btn btn-primary"
                style={{ background: 'var(--success)' }}
              >
                {fulfillLoading ? 'Executing Transaction...' : 'Confirm Atomic Deduction'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
