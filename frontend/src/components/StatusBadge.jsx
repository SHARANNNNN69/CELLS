import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';

export default function StatusBadge({ type, value }) {
  if (!value) return null;

  const val = String(value).toLowerCase();

  if (type === 'urgency') {
    if (val === 'emergency') {
      return (
        <span className="badge badge-emergency">
          <AlertCircle size={12} /> Emergency (0-6h)
        </span>
      );
    }
    if (val === 'urgent') {
      return (
        <span className="badge badge-urgent">
          <Clock size={12} /> Urgent (24h)
        </span>
      );
    }
    return (
      <span className="badge badge-standard">
        Standard
      </span>
    );
  }

  if (type === 'batch') {
    if (val === 'tested_safe') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} /> Tested & Safe
        </span>
      );
    }
    if (val === 'quarantined') {
      return (
        <span className="badge badge-quarantined">
          <Clock size={12} /> Quarantined
        </span>
      );
    }
    if (val === 'expired') {
      return (
        <span className="badge badge-expired">
          <XCircle size={12} /> Expired
        </span>
      );
    }
    return (
      <span className="badge badge-standard">
        {val}
      </span>
    );
  }

  if (type === 'verification') {
    if (val === 'verified') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} /> Verified
        </span>
      );
    }
    if (val === 'pending') {
      return (
        <span className="badge badge-quarantined">
          <Clock size={12} /> Verification Pending
        </span>
      );
    }
    return (
      <span className="badge badge-emergency">
        <ShieldAlert size={12} /> Unverified
      </span>
    );
  }

  if (val === 'open') {
    return <span className="badge badge-urgent"><Clock size={12} /> Open</span>;
  }
  if (val === 'fulfilled') {
    return <span className="badge badge-success"><CheckCircle2 size={12} /> Fulfilled</span>;
  }
  if (val === 'cancelled') {
    return <span className="badge badge-expired"><XCircle size={12} /> Cancelled</span>;
  }

  return <span className="badge badge-standard">{val}</span>;
}
