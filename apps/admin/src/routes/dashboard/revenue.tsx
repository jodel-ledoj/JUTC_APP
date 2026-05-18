import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { api } from '../../lib/api';
import KpiCard from '../../components/ui/KpiCard';

const DATE_RANGES = [
  { label: 'Today', days: 0 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
];

export default function Revenue() {
  const [rangeDays, setRangeDays] = useState(7);

  const fromISO = new Date(Date.now() - rangeDays * 86_400_000).toISOString();

  const { data: revenue } = useQuery({
    queryKey: ['admin', 'revenue', rangeDays],
    queryFn: async () => (await api.get('/admin/revenue', { params: { from: fromISO } })).data.data,
  });

  const { data: dailySeries } = useQuery({
    queryKey: ['admin', 'revenue', 'daily', rangeDays],
    queryFn: async () =>
      (await api.get('/admin/revenue/daily', { params: { from: fromISO } })).data.data as { date: string; totalJMD: number }[],
    enabled: rangeDays > 0,
  });

  const totalRevenue = revenue?.transactions?.reduce(
    (sum: number, t: any) => sum + Number(t._sum?.amountJMD ?? 0), 0,
  ) ?? 0;
  const tapRevenue = revenue?.transactions?.find((t: any) => t.type === 'TAP_IN')?._sum?.amountJMD ?? 0;

  const chartData = (dailySeries ?? []).map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('en-JM', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Revenue Analytics</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {DATE_RANGES.map(({ label, days }) => (
            <button key={days} onClick={() => setRangeDays(days)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid',
              borderColor: rangeDays === days ? '#2F80ED' : '#2A2F38',
              background: rangeDays === days ? '#2F80ED22' : 'transparent',
              color: rangeDays === days ? '#2F80ED' : '#B6BDC9', cursor: 'pointer', fontSize: 13,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <KpiCard title="Total Revenue" value={`$${Number(totalRevenue).toLocaleString()}`} subtitle="JMD" color="#27AE60" />
        <KpiCard title="Fare Revenue" value={`$${Number(tapRevenue).toLocaleString()}`} subtitle="from tap events" color="#2F80ED" />
        <KpiCard title="Manual Overrides" value={revenue?.overrideCount ?? 0} color="#F2C94C" />
        <KpiCard title="Fraud Alerts" value={revenue?.fraudAlerts ?? 0} color="#EB5757" />
      </div>

      {chartData.length > 0 && (
        <div style={{ background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Daily Fare Revenue (JMD)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2F38" />
              <XAxis dataKey="dateLabel" tick={{ fill: '#B6BDC9', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B6BDC9', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#20252f', border: '1px solid #2A2F38', borderRadius: 8 }}
                labelStyle={{ color: '#F5F7FA', fontWeight: 600 }}
                itemStyle={{ color: '#27AE60' }}
                formatter={(value: number) => [`$${value.toLocaleString()} JMD`, 'Revenue']}
              />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12, color: '#B6BDC9' }} />
              <Line type="monotone" dataKey="totalJMD" name="Fare Revenue" stroke="#27AE60" strokeWidth={2} dot={{ fill: '#27AE60', r: 3 }} activeDot={{ r: 5, fill: '#27AE60' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background: '#1A1D23', borderRadius: 12, padding: 20, border: '1px solid #2A2F38' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Revenue by Route</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Route ID', 'Boardings', 'Total (JMD)'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#B6BDC9', borderBottom: '1px solid #2A2F38' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {revenue?.byRoute?.slice(0, 10).map((row: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #2A2F38' }}>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{row.routeId?.slice(0, 8) ?? 'N/A'}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{row._count?.id ?? 0}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: '#27AE60' }}>${Number(row._sum?.amountJMD ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!revenue?.byRoute?.length && <p style={{ color: '#B6BDC9', textAlign: 'center', padding: 24 }}>No revenue data</p>}
      </div>
    </div>
  );
}
