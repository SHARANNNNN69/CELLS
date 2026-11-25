import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2.5rem 1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: '#fee2e2', borderRadius: '50%', color: 'var(--danger)', marginBottom: '1rem' }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your account role (<strong>{user.role}</strong>) does not have authorization to view this management module.
          </p>
          <a href="/" className="btn btn-primary">
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  return children;
}
