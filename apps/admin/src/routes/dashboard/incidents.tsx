import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#B6BDC9', MEDIUM: '#F2C94C', HIGH: '#EB5757', CRITICAL: '#FF0000',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#EB5757', UNDER_REVIEW: '#F2C94C', RESOLVED: '#27AE60', DISMISSED: '#B6BDC9',
};

export default function Incidents() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ['incidents', statusFilter],
    queryFn: async () => (await api.get('/incidents', { params: statusFilter ? { status: statusFilter } : {} })).data,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) =>
      (await api.patch(`/incidents/${id}`, { status, adminNotes })).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setSelected(null);
    },
  });

  const statuses = ['', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'];

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 96px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Customer Issues</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid',
                borderColor: statusFilter === s ? '#2F80ED' : '#2A2F38',
                background: statusFilter === s ? '#2F80ED22' : 'transparent',
                color: statusFilter === s ? '#2F80ED' : '#B6BDC9',
                cursor: 'pointer', fontSize: 12,
              }}>{s || 'All'}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: '#1A1D23', borderRadius: 12, border: '1px solid #2A2F38', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1A1D23' }}>
              <tr>
                {['Type', 'Severity', 'Status', 'Reported', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#B6BDC9', borderBottom: '1px solid #2A2F38' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((incident: any) => (
                <tr key={incident.id} style={{ borderBottom: '1px solid #2A2F38', cursor: 'pointer' }} onClick={() => setSelected(incident)}>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{incident.type.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: SEVERITY_COLORS[incident.severity], fontSize: 12, fontWeight: 600 }}>{incident.severity}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: `${STATUS_COLORS[incident.status]}22`, color: STATUS_COLORS[incident.status], borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
                      {incident.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#B6BDC9' }}>{new Date(incident.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(incident); }} style={{ background: '#2F80ED22', border: 'none', borderRadius: 6, padding: '6px 12px', color: '#2F80ED', cursor: 'pointer', fontSize: 12 }}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.data?.length && <p style={{ textAlign: 'center', color: '#B6BDC9', padding: 40 }}>No incidents</p>}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div style={{ width: 360, background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38', overflow: 'auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Incident Detail</h2>
          <p style={{ fontSize: 13, color: '#B6BDC9', marginBottom: 4 }}>Type</p>
          <p style={{ fontSize: 14, marginBottom: 16 }}>{selected.type.replace(/_/g, ' ')}</p>
          <p style={{ fontSize: 13, color: '#B6BDC9', marginBottom: 4 }}>Description</p>
          <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>{selected.description}</p>
          <p style={{ fontSize: 13, color: '#B6BDC9', marginBottom: 8 }}>Update Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map(s => (
              <button
                key={s}
                onClick={() => updateMutation.mutate({ id: selected.id, status: s })}
                style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${STATUS_COLORS[s]}`, background: `${STATUS_COLORS[s]}22`, color: STATUS_COLORS[s], cursor: 'pointer', fontSize: 13, textAlign: 'left' }}
              >
                Mark as {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <button onClick={() => setSelected(null)} style={{ marginTop: 16, width: '100%', padding: 12, background: 'transparent', border: '1px solid #2A2F38', borderRadius: 8, color: '#B6BDC9', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
