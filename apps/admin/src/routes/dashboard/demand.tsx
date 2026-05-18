import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

const HOURS = Array.from({ length: 16 }, (_, i) => `${i + 6}:00`);

export default function Demand() {
  const [routeId, setRouteId] = useState('');

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data.data,
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['admin', 'demand', routeId],
    queryFn: async () => {
      if (!routeId) return null;
      return (await api.get('/admin/demand', { params: { routeId } })).data.data as {
        byHour: Record<string, number>;
        byStop: Record<string, number>;
        total: number;
      };
    },
    enabled: !!routeId,
  });

  const byHour = heatmapData?.byHour ?? {};
  const byStop = heatmapData?.byStop ?? {};
  const maxCount = Math.max(...Object.values(byHour), 1);
  const maxStop = Math.max(...Object.values(byStop), 1);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Demand Intelligence</h1>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, color: '#B6BDC9', display: 'block', marginBottom: 8 }}>Select Route</label>
        <select
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          style={{ background: '#1A1D23', border: '1px solid #2A2F38', borderRadius: 8, padding: '10px 16px', color: '#F5F7FA', fontSize: 14, minWidth: 240 }}
        >
          <option value="">Choose a route...</option>
          {routes?.map((r: any) => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
        </select>
        {heatmapData && (
          <span style={{ marginLeft: 16, fontSize: 13, color: '#B6BDC9' }}>
            {heatmapData.total.toLocaleString()} total boardings
          </span>
        )}
      </div>

      {heatmapData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Boardings by Hour */}
          <div style={{ background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Boardings by Hour</h2>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 200 }}>
              {HOURS.map((hour, i) => {
                const count = byHour[String(i + 6)] ?? 0;
                const height = Math.max((count / maxCount) * 160, 4);
                const isRush = i === 1 || i === 2 || i === 10 || i === 11 || i === 12;
                return (
                  <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: '#B6BDC9' }}>{count}</span>
                    <div style={{ width: '100%', height, borderRadius: 4, background: isRush ? '#EB5757' : count > maxCount * 0.7 ? '#F2C94C' : '#2F80ED' }} />
                    <span style={{ fontSize: 10, color: '#B6BDC9', transform: 'rotate(-45deg)', transformOrigin: 'center', marginTop: 4 }}>{hour}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              {[{ color: '#2F80ED', label: 'Normal' }, { color: '#F2C94C', label: 'High' }, { color: '#EB5757', label: 'Rush Hour' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                  <span style={{ fontSize: 12, color: '#B6BDC9' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boardings by Stop/Validator */}
          {Object.keys(byStop).length > 0 && (
            <div style={{ background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Boardings by Stop (Validator)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(byStop)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([validatorId, count]) => (
                    <div key={validatorId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#B6BDC9', width: 120, flexShrink: 0 }}>{validatorId.slice(0, 12)}…</span>
                      <div style={{ flex: 1, height: 8, background: '#2A2F38', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(count / maxStop) * 100}%`, height: '100%', background: '#2F80ED', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#F5F7FA', width: 32, textAlign: 'right' }}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#1A1D23', borderRadius: 12, padding: 40, border: '1px solid #2A2F38', textAlign: 'center', color: '#B6BDC9' }}>
          Select a route to view demand data
        </div>
      )}
    </div>
  );
}
