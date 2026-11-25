import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EmergencyBanner from './components/EmergencyBanner';
import RoleRoute from './components/RoleRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import FindBloodPage from './pages/public/FindBloodPage';
import DonorsSearchPage from './pages/public/DonorsSearchPage';
import EmergencyRequestPage from './pages/public/EmergencyRequestPage';
import RequestsListPage from './pages/public/RequestsListPage';
import RequestDetailPage from './pages/public/RequestDetailPage';
import AnalyticsPage from './pages/public/AnalyticsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboards
import DonorDashboard from './pages/donor/DonorDashboard';
import BloodBankDashboard from './pages/bloodbank/BloodBankDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import RequesterDashboard from './pages/requester/RequesterDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <div className="app-container">
      <EmergencyBanner />
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public discovery routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/find-blood" element={<FindBloodPage />} />
          <Route path="/donors" element={<DonorsSearchPage />} />
          <Route path="/emergency" element={<EmergencyRequestPage />} />
          <Route path="/requests" element={<RequestsListPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Role Portals */}
          <Route 
            path="/dashboard/donor" 
            element={
              <RoleRoute allowedRoles={['donor', 'admin']}>
                <DonorDashboard />
              </RoleRoute>
            } 
          />
          <Route 
            path="/dashboard/bloodbank" 
            element={
              <RoleRoute allowedRoles={['blood_bank', 'admin']}>
                <BloodBankDashboard />
              </RoleRoute>
            } 
          />
          <Route 
            path="/dashboard/hospital" 
            element={
              <RoleRoute allowedRoles={['hospital', 'admin']}>
                <HospitalDashboard />
              </RoleRoute>
            } 
          />
          <Route 
            path="/dashboard/requester" 
            element={
              <RoleRoute allowedRoles={['requester', 'admin', 'public_visitor']}>
                <RequesterDashboard />
              </RoleRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            } 
          />

          {/* 404 Fallback */}
          <Route 
            path="*" 
            element={
              <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <h2>Page Not Found</h2>
                <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>The requested page could not be located.</p>
                <a href="/" className="btn btn-primary">Return Home</a>
              </div>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
