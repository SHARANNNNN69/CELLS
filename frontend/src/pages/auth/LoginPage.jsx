import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Droplet, Lock, Mail, Shield, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Route directly to respective dashboard based on role
      switch (user.role) {
        case 'donor': navigate('/dashboard/donor'); break;
        case 'blood_bank': navigate('/dashboard/bloodbank'); break;
        case 'hospital': navigate('/dashboard/hospital'); break;
        case 'admin': navigate('/dashboard/admin'); break;
        case 'requester': navigate('/dashboard/requester'); break;
        default: navigate('/'); break;
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoRole = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '10px', 
          borderRadius: '12px', 
          background: 'var(--primary-light)', 
          color: 'var(--primary)',
          marginBottom: '1rem' 
        }}>
          <Droplet size={28} fill="currentColor" />
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Sign in to CELLS</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Role-based emergency blood donation & inventory platform
        </p>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', marginBottom: '1.5rem', padding: '0.85rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Login Form */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-control" 
                placeholder="name@cells.org"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>

      {/* Viva / Quick Demo Accounts Selector */}
      <div className="card" style={{ background: '#f8fafc', padding: '1.25rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          <Shield size={16} color="var(--primary)" />
          <span>One-Click Academic Demo Accounts</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Click any preset persona to populate credentials:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          <button 
            type="button" 
            onClick={() => selectDemoRole('admin@cells.org', 'Admin@1234')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            🛡️ Super Admin
          </button>
          <button 
            type="button" 
            onClick={() => selectDemoRole('staff@metroblood.org', 'Bank@1234')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            🏥 Blood Bank Staff
          </button>
          <button 
            type="button" 
            onClick={() => selectDemoRole('doctor@citycare.org', 'Hosp@1234')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            🩺 Hospital Doctor
          </button>
          <button 
            type="button" 
            onClick={() => selectDemoRole('donor.rajesh@cells.sample', 'Donor@1234')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            🩸 O+ Donor
          </button>
          <button 
            type="button" 
            onClick={() => selectDemoRole('requester.amit@cells.sample', 'Req@1234')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            🚨 Requester
          </button>
          <button 
            type="button" 
            onClick={() => selectDemoRole('visitor.demo@cells.sample', 'Visit@1234')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
          >
            👁️ Public Visitor
          </button>
        </div>
      </div>
    </div>
  );
}
