import React from 'react';
import { Map, DollarSign, TrendingUp, AlertTriangle, Wrench, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import type { Page } from './DashboardLayout';

const NAV_ITEMS: { page: Page; label: string; Icon: any }[] = [
  { page: 'fleet', label: 'Fleet Overview', Icon: Map },
  { page: 'revenue', label: 'Revenue', Icon: DollarSign },
  { page: 'demand', label: 'Demand', Icon: TrendingUp },
  { page: 'incidents', label: 'Incidents', Icon: AlertTriangle },
  { page: 'maintenance', label: 'Maintenance', Icon: Wrench },
  { page: 'notifications', label: 'Notifications', Icon: Bell },
];

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ currentPage, onNavigate }: Props) {
  const { user, clearAuth } = useAuthStore();

  return (
    <nav style={{
      width: 220, background: '#1A1D23', borderRight: '1px solid #2A2F38',
      display: 'flex', flexDirection: 'column', padding: '24px 0',
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2A2F38' }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#2F80ED', letterSpacing: 3 }}>JUTC</p>
        <p style={{ fontSize: 11, color: '#B6BDC9', marginTop: 2 }}>Operations</p>
      </div>

      <div style={{ flex: 1, padding: '12px 0' }}>
        {NAV_ITEMS.map(({ page, label, Icon }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 20px', border: 'none', cursor: 'pointer',
                background: active ? '#2F80ED22' : 'transparent',
                color: active ? '#2F80ED' : '#B6BDC9',
                fontSize: 14, fontWeight: active ? 600 : 400,
                borderLeft: `3px solid ${active ? '#2F80ED' : 'transparent'}`,
                textAlign: 'left',
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #2A2F38' }}>
        <p style={{ fontSize: 13, color: '#F5F7FA', fontWeight: 600 }}>{user?.name}</p>
        <p style={{ fontSize: 11, color: '#B6BDC9' }}>{user?.role}</p>
        <button
          onClick={clearAuth}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, background: 'none', border: 'none', color: '#B6BDC9', cursor: 'pointer', fontSize: 13 }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </nav>
  );
}
