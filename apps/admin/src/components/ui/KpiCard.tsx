import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

export default function KpiCard({ title, value, subtitle, color = '#2F80ED', icon }: Props) {
  return (
    <div style={{
      background: '#1A1D23', borderRadius: 12, padding: 20,
      border: '1px solid #2A2F38', flex: 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: 13, color: '#B6BDC9' }}>{title}</p>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <p style={{ fontSize: 32, fontWeight: 800, color, marginTop: 8 }}>{value}</p>
      {subtitle && <p style={{ fontSize: 12, color: '#B6BDC9', marginTop: 4 }}>{subtitle}</p>}
    </div>
  );
}
