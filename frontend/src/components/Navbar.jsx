import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Heart, Bell, User, LogOut, Shield, Activity, 
  Search, Users, Hospital, Droplet, Menu, X, Check 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'donor': return '/dashboard/donor';
      case 'blood_bank': return '/dashboard/bloodbank';
      case 'hospital': return '/dashboard/hospital';
      case 'admin': return '/dashboard/admin';
      case 'requester': return '/dashboard/requester';
      default: return '/';
    }
  };

  const getDashboardLabel = () => {
    if (!user) return 'Portal';
    switch (user.role) {
      case 'donor': return 'Donor Portal';
      case 'blood_bank': return 'Blood Bank Staff';
      case 'hospital': return 'Hospital Portal';
      case 'admin': return 'Super Admin';
      case 'requester': return 'My Requests';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        {/* Brand */}
        <Link to="/" className="brand-logo">
          <span style={{ 
            display: 'inline-flex', 
            padding: '7px', 
            borderRadius: '10px', 
            background: 'var(--primary-light)',
            color: 'var(--primary)'
          }}>
            <Droplet size={22} fill="currentColor" />
          </span>
          <span>CELLS</span>
          <span className="brand-tag">Network</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links">
          <Link to="/find-blood" className="nav-link">
            <Search size={16} /> Find Blood
          </Link>
          <Link to="/donors" className="nav-link">
            <Users size={16} /> Donors
          </Link>
          <Link to="/requests" className="nav-link">
            <Activity size={16} /> Live Requests
          </Link>
          <Link to="/analytics" className="nav-link">
            <Heart size={16} /> Analytics
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="nav-actions">
          <Link to="/emergency" className="btn btn-sm btn-danger-emergency">
            Emergency Request
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="btn btn-secondary btn-sm"
                  style={{ position: 'relative', padding: '0.45rem' }}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--primary)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderRadius: '9999px',
                      height: '18px',
                      minWidth: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '42px',
                    width: '320px',
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc'
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Notifications ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead} 
                          style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map(n => (
                          <div 
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifs(false);
                            }}
                            style={{
                              padding: '0.65rem 1rem',
                              borderBottom: '1px solid var(--border)',
                              background: n.is_read ? '#fff' : '#f0f9ff',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: n.type === 'emergency' ? 'var(--danger)' : 'var(--text-main)' }}>
                              {n.title}
                            </div>
                            <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.75rem' }}>
                              {n.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Dashboard Link */}
              <Link to={getDashboardLink()} className="btn btn-secondary btn-sm" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={14} color="var(--primary)" />
                <span>{getDashboardLabel()}</span>
              </Link>

              {/* Logout Button */}
              <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Join Network
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
