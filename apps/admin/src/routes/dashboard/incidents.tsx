import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { getAdminSocket } from '../../lib/socket';

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#B6BDC9', MEDIUM: '#F2C94C', HIGH: '#EB5757', CRITICAL: '#FF0000',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#EB5757', UNDER_REVIEW: '#F2C94C', RESOLVED: '#27AE60', DISMISSED: '#B6BDC9',
};

const INCIDENT_LABEL: Record<string, string> = {
  BREAKDOWN: 'Breakdown',
  ACCIDENT: 'Accident',
  PASSENGER_INCIDENT: 'Passenger Incident',
  ROAD_HAZARD: 'Road Hazard',
  MECHANICAL_ISSUE: 'Mechanical Issue',
  EMERGENCY: 'Emergency',
  MISSED_STOP: 'Missed Stop',
  RECKLESS_DRIVING: 'Reckless Driving',
  HARASSMENT: 'Harassment',
  OVERCHARGING: 'Overcharging',
  BROKEN_EQUIPMENT: 'Broken Equipment',
  OTHER: 'Other',
};

function incidentToAlertPayload(incident: any) {
  const severityMap: Record<string, string> = {
    LOW: 'INFO', MEDIUM: 'WARNING', HIGH: 'WARNING', CRITICAL: 'CRITICAL',
  };
  const typeMap: Record<string, string> = {
    BREAKDOWN: 'SERVICE_ALERT', ACCIDENT: 'EMERGENCY', EMERGENCY: 'EMERGENCY',
    ROAD_HAZARD: 'SERVICE_ALERT', MECHANICAL_ISSUE: 'SERVICE_ALERT',
    PASSENGER_INCIDENT: 'SERVICE_ALERT',
  };
  return {
    type: typeMap[incident.type] ?? 'SERVICE_ALERT',
    severity: severityMap[incident.severity] ?? 'WARNING',
    title: INCIDENT_LABEL[incident.type] ?? incident.type,
    body: incident.description,
    routeId: incident.routeId ?? undefined,
  };
}

export default function Incidents() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [newCount, setNewCount] = useState(0);
  const [promoteSuccess, setPromoteSuccess] = useState(false);

  const { data } = useQuery({
    queryKey: ['incidents', statusFilter],
    queryFn: async () => (await api.get('/incidents', { params: statusFilter ? { status: statusFilter } : {} })).data,
  });

  // Real-time: listen for new incidents from drivers
  useEffect(() => {
    const socket = getAdminSocket();
    const handler = () => {
      setNewCount((n) => n + 1);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    };
    socket.on('incident:new', handler);
    return () => { socket.off('incident:new', handler); };
  }, []);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) =>
      (await api.patch(`/incidents/${id}`, { status, adminNotes })).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setSelected(null);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (incident: any) =>
      (await api.post('/notifications', incidentToAlertPayload(incident))).data.data,
    onSuccess: () => {
      setPromoteSuccess(true);
      setTimeout(() => setPromoteSuccess(false), 3000);
    },
  });

  const statuses = ['', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'];

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 96px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Operational Incidents</h1>
            {newCount > 0 && (
              <span
                style={{ background: '#EB5757', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setNewCount(0)}
              >
                {newCount} new
              </span>
            )}
          </div>
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

        {promoteSuccess && (
          <div style={{ background: '#27AE6022', border: '1px solid #27AE60', borderRadius: 8, padding: '10px 16px', marginBottom: 12, color: '#27AE60', fontSize: 13 }}>
            Alert published to passengers
          </div>
        )}

        <div style={{ flex: 1, background: '#1A1D23', borderRadius: 12, border: '1px solid #2A2F38', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1A1D23' }}>
              <tr>
                {['Type', 'Reported By', 'Severity', 'Status', 'Reported', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#B6BDC9', borderBottom: '1px solid #2A2F38' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((incident: any) => (
                <tr key={incident.id} style={{ borderBottom: '1px solid #2A2F38', cursor: 'pointer' }} onClick={() => setSelected(incident)}>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{INCIDENT_LABEL[incident.type] ?? incident.type.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#B6BDC9' }}>
                    {incident.reporter?.name ?? '—'}
                    {incident.reporter?.role && (
                      <span style={{ marginLeft: 6, color: '#555', fontSize: 11 }}>({incident.reporter.role})</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: SEVERITY_COLORS[incident.severity], fontSize: 12, fontWeight: 600 }}>{incident.severity}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: `${STATUS_COLORS[incident.status]}22`, color: STATUS_COLORS[incident.status], borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>
                      {incident.status.replace(/_/g, ' ')}
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
        <div style={{ width: 380, background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Incident Detail</h2>

          <Field label="Type" value={INCIDENT_LABEL[selected.type] ?? selected.type.replace(/_/g, ' ')} />
          <Field label="Severity" value={selected.severity} color={SEVERITY_COLORS[selected.severity]} />
          <Field label="Status" value={selected.status.replace(/_/g, ' ')} color={STATUS_COLORS[selected.status]} />
          {selected.reporter && <Field label="Reported By" value={`${selected.reporter.name} (${selected.reporter.role})`} />}
          <Field label="Submitted" value={new Date(selected.createdAt).toLocaleString()} />

          <p style={{ fontSize: 13, color: '#B6BDC9', marginBottom: 4 }}>Description</p>
          <p style={{ fontSize: 14, marginBottom: 20, lineHeight: 1.5, color: '#F5F7FA' }}>{selected.description}</p>

          {/* Promote to public alert */}
          {selected.status !== 'DISMISSED' && (
            <div style={{ background: '#22262E', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #2A2F38' }}>
              <p style={{ fontSize: 12, color: '#B6BDC9', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Publish to Passengers
              </p>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 1.5 }}>
                Convert this incident into a public service alert visible to all passengers on the affected route.
              </p>
              <button
                onClick={() => promoteMutation.mutate(selected)}
                disabled={promoteMutation.isPending}
                style={{
                  width: '100%', background: '#F2C94C22', border: '1px solid #F2C94C',
                  borderRadius: 8, padding: '10px 16px', color: '#F2C94C',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                {promoteMutation.isPending ? 'Publishing...' : 'Promote to Public Alert'}
              </button>
            </div>
          )}

          <p style={{ fontSize: 13, color: '#B6BDC9', marginBottom: 8 }}>Update Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
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

          <button onClick={() => setSelected(null)} style={{ width: '100%', padding: 12, background: 'transparent', border: '1px solid #2A2F38', borderRadius: 8, color: '#B6BDC9', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, color: '#B6BDC9', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, color: color ?? '#F5F7FA' }}>{value}</p>
    </div>
  );
}
