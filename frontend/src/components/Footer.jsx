import React from 'react';
import { Droplet, Heart, Shield, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#ffffff', borderTop: '1px solid var(--border)', marginTop: '4rem', padding: '3rem 0 1.5rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <Droplet size={20} fill="currentColor" />
              <span>CELLS Network</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              A full-stack coordination prototype connecting blood banks, voluntary donors, hospitals, and emergency requesters with audited inventory safety.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Quick Discovery
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <Link to="/find-blood" style={{ hover: { color: 'var(--primary)' } }}>Find Blood Inventory</Link>
              <Link to="/donors">Voluntary Donor Registry</Link>
              <Link to="/emergency">Emergency Request Desk</Link>
              <Link to="/analytics">Analytics & Batch Health</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Portals & Roles
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <Link to="/dashboard/donor">Donor Self-Service</Link>
              <Link to="/dashboard/bloodbank">Blood Bank Staff & Batches</Link>
              <Link to="/dashboard/hospital">Hospital Coordinator</Link>
              <Link to="/dashboard/admin">Platform Admin Console</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-main)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              Academic Scope
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Interdisciplinary project for Software Engineering (SE) & Web Technology (WT). Prepared with verifiable relational schema, transaction safeguards, and role-based security.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>
            © 2026 CELLS Network Prototype. Developed for Academic Demonstration.
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Synthetic Demonstration Data</span>
            <span>•</span>
            <span>Not A Medical Device</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
