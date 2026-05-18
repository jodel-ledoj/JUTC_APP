import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wrench, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import KpiCard from '../../components/ui/KpiCard';

export default function Maintenance() {
  const { data: alerts } = useQuery({
    queryKey: ['admin', 'maintenance'],
    queryFn: async () => (await api.get('/admin/maintenance')).data.data,
    refetchInterval: 60_000,
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Maintenance Control</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <KpiCard title="Open Defects" value={alerts?.openDefects?.length ?? 0} color="#EB5757" icon={<AlertTriangle size={20} />} />
        <KpiCard title="In Maintenance" value={alerts?.breakdownWatchlist?.length ?? 0} color="#F2C94C" icon={<Wrench size={20} />} />
        <KpiCard title="Overdue Service" value={alerts?.overdueBuses?.length ?? 0} color="#B6BDC9" subtitle="10,000+ km since service" />
      </div>

      {/* Open Defects */}
      <div style={{ background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Open Defects</h2>
        {alerts?.openDefects?.map((defect: any) => (
          <div key={defect.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2A2F38' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{defect.bus?.plateNumber} — {defect.description}</p>
              <p style={{ fontSize: 12, color: '#B6BDC9', marginTop: 2 }}>{defect.severity} severity · Reported {new Date(defect.createdAt).toLocaleDateString()}</p>
            </div>
            <span style={{ color: defect.severity === 'CRITICAL' ? '#EB5757' : defect.severity === 'HIGH' ? '#F2C94C' : '#B6BDC9', fontSize: 12, fontWeight: 600 }}>
              {defect.severity}
            </span>
          </div>
        ))}
        {!alerts?.openDefects?.length && <p style={{ color: '#27AE60' }}>✓ No open defects</p>}
      </div>

      {/* Buses Due for Service */}
      <div style={{ background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Overdue Service</h2>
        {alerts?.overdueBuses?.map((bus: any) => {
          const kmOverdue = Math.round(bus.odometerKm - bus.lastServiceKm - 10000);
          return (
            <div key={bus.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2A2F38' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{bus.plateNumber}</p>
                <p style={{ fontSize: 12, color: '#B6BDC9' }}>{Math.round(bus.odometerKm).toLocaleString()} km total · {Math.round(bus.lastServiceKm).toLocaleString()} km at last service</p>
              </div>
              <span style={{ color: '#EB5757', fontSize: 13, fontWeight: 600 }}>{kmOverdue.toLocaleString()} km overdue</span>
            </div>
          );
        })}
        {!alerts?.overdueBuses?.length && <p style={{ color: '#27AE60' }}>✓ All buses within service interval</p>}
      </div>
    </div>
  );
}
