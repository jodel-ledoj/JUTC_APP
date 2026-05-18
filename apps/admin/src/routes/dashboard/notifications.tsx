import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Plus, AlertTriangle, Info } from 'lucide-react';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';

const SEVERITY_COLORS: Record<string, string> = {
  INFO: '#2F80ED', WARNING: '#F2C94C', CRITICAL: '#EB5757',
};

export default function Notifications() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'DELAY', severity: 'INFO', title: '', body: '', routeId: '' });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.data,
    refetchInterval: 30_000,
  });

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data.data,
  });

  const publishMutation = useMutation({
    mutationFn: async () => (await api.post('/notifications', {
      type: form.type,
      severity: form.severity,
      title: form.title,
      body: form.body,
      routeId: form.routeId || undefined,
    })).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowForm(false);
      setForm({ type: 'DELAY', severity: 'INFO', title: '', body: '', routeId: '' });
    },
  });

  const inputStyle = {
    background: '#22262E', border: '1px solid #2A2F38', borderRadius: 8,
    padding: '10px 14px', color: '#F5F7FA', fontSize: 14, width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Service Notifications</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2F80ED', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          <Plus size={16} /> Publish Alert
        </button>
      </div>

      {/* Publish Form */}
      {showForm && (
        <div style={{ background: '#1A1D23', borderRadius: 12, padding: 24, border: '1px solid #2A2F38', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Service Alert</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#B6BDC9', display: 'block', marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                {['DELAY', 'ROUTE_CHANGE', 'SERVICE_ALERT', 'EMERGENCY', 'SYSTEM'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#B6BDC9', display: 'block', marginBottom: 6 }}>Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} style={inputStyle}>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#B6BDC9', display: 'block', marginBottom: 6 }}>Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Alert title..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#B6BDC9', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Alert message..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#B6BDC9', display: 'block', marginBottom: 6 }}>Route (optional)</label>
            <select value={form.routeId} onChange={e => setForm(f => ({ ...f, routeId: e.target.value }))} style={inputStyle}>
              <option value="">All routes</option>
              {routes?.map((r: any) => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => publishMutation.mutate()} disabled={!form.title || !form.body || publishMutation.isPending}
              style={{ background: '#2F80ED', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid #2A2F38', borderRadius: 8, padding: '10px 24px', color: '#B6BDC9', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div style={{ background: '#1A1D23', borderRadius: 12, border: '1px solid #2A2F38', overflow: 'hidden' }}>
        {notifications?.map((n: any) => (
          <div key={n.id} style={{ display: 'flex', gap: 16, padding: 20, borderBottom: '1px solid #2A2F38', alignItems: 'flex-start' }}>
            <div style={{ color: SEVERITY_COLORS[n.severity], marginTop: 2 }}>
              {n.severity === 'CRITICAL' ? <AlertTriangle size={18} /> : <Info size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: '#B6BDC9' }}>{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 13, color: '#B6BDC9', marginTop: 4 }}>{n.body}</p>
              <span style={{
                display: 'inline-block', marginTop: 8,
                background: `${SEVERITY_COLORS[n.severity]}22`, color: SEVERITY_COLORS[n.severity],
                borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600,
              }}>
                {n.severity}
              </span>
            </div>
          </div>
        ))}
        {!notifications?.length && <p style={{ textAlign: 'center', color: '#B6BDC9', padding: 40 }}>No active notifications</p>}
      </div>
    </div>
  );
}
