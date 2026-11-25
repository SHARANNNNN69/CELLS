import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyBanner() {
  return (
    <div className="prototype-notice">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
          <AlertTriangle size={15} color="#b45309" />
          DEMO & ACADEMIC PROTOTYPE:
        </span>
        <span>
          CELLS is an interdisciplinary Software Engineering demonstration using synthetic sample records. For life-threatening emergencies, call national emergency services or your nearest verified hospital blood bank directly.
        </span>
        <Link to="/emergency" className="btn btn-sm btn-danger-emergency" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
          <PhoneCall size={12} /> Post Urgent Request
        </Link>
      </div>
    </div>
  );
}
