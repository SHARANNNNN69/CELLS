import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Activity, AlertCircle, Clock, ShieldCheck, Heart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(res => {
        if (res.success) setData(res.data);
      })
      .catch(err => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading analytics telemetry...</div>;

  // Chart 1: Stock by Blood Group
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const stockCounts = bloodGroups.map(bg => {
    const item = data?.stockByGroup?.find(i => i.blood_group === bg);
    return item ? Number(item.units) : 0;
  });

  const stockChartData = {
    labels: bloodGroups,
    datasets: [{
      label: 'Tested Safe Units Available',
      data: stockCounts,
      backgroundColor: '#b91c1c',
      borderRadius: 6
    }]
  };

  // Chart 2: Stock by Component (Doughnut)
  const compLabels = data?.stockByComponent?.map(c => c.component) || [];
  const compUnits = data?.stockByComponent?.map(c => Number(c.units)) || [];

  const compChartData = {
    labels: compLabels,
    datasets: [{
      data: compUnits,
      backgroundColor: ['#b91c1c', '#2563eb', '#15803d', '#d97706', '#7c3aed']
    }]
  };

  // Chart 3: Requests by Urgency
  const urgencyLabels = ['emergency', 'urgent', 'standard'];
  const urgencyCounts = urgencyLabels.map(u => {
    const item = data?.requestsByUrgency?.find(i => i.urgency === u);
    return item ? Number(item.count) : 0;
  });

  const urgencyChartData = {
    labels: ['Emergency (0-6h)', 'Urgent (24h)', 'Standard (Scheduled)'],
    datasets: [{
      label: 'Active Requests',
      data: urgencyCounts,
      backgroundColor: ['#dc2626', '#ea580c', '#0284c7'],
      borderRadius: 6
    }]
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Platform Analytics & Telemetry</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Real-time metrics on blood component inventory, emergency triage distributions, and expiring batch monitors.
        </p>
      </div>

      {/* Academic Disclaimer */}
      <div className="card" style={{ background: '#fffbeb', borderLeft: '4px solid var(--warning)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} color="#b45309" />
          <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
            <strong>Demo Analytics Disclaimer:</strong> Telemetry reflects entered and synthetic test records within the CELLS project database, not national census data.
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Tested Units by Blood Group (ABO/Rh)
          </h3>
          <div style={{ height: '260px' }}>
            <Bar 
              data={stockChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Component-Wise Inventory Share
          </h3>
          <div style={{ height: '260px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut 
              data={compChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }} 
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Clinical Requisitions by Urgency Tier
          </h3>
          <div style={{ height: '260px' }}>
            <Bar 
              data={urgencyChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Expiring Batches Watchlist Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)' }}>
            <Clock size={18} /> Expiring Batch Watchlist (Next 7 Days)
          </h3>
        </div>

        {data?.expiringBatches?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No batches expiring within the next 7 days.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Blood Group</th>
                  <th>Component</th>
                  <th>Units</th>
                  <th>Expiry Date</th>
                  <th>Blood Bank</th>
                </tr>
              </thead>
              <tbody>
                {data?.expiringBatches?.map((b, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{b.batch_number}</td>
                    <td><span className="badge badge-standard">{b.blood_group}</span></td>
                    <td>{b.component}</td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{b.units_available}</td>
                    <td>{b.expiry_date.slice(0, 10)}</td>
                    <td>{b.blood_bank_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
