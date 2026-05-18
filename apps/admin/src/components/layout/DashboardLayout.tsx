import React, { useState } from 'react';
import Sidebar from './Sidebar';
import FleetOverview from '../../routes/dashboard/index';
import Revenue from '../../routes/dashboard/revenue';
import Demand from '../../routes/dashboard/demand';
import Incidents from '../../routes/dashboard/incidents';
import Maintenance from '../../routes/dashboard/maintenance';
import Notifications from '../../routes/dashboard/notifications';

export type Page = 'fleet' | 'revenue' | 'demand' | 'incidents' | 'maintenance' | 'notifications';

const PAGES: Record<Page, React.ComponentType> = {
  fleet: FleetOverview,
  revenue: Revenue,
  demand: Demand,
  incidents: Incidents,
  maintenance: Maintenance,
  notifications: Notifications,
};

export default function DashboardLayout() {
  const [currentPage, setCurrentPage] = useState<Page>('fleet');
  const PageComponent = PAGES[currentPage];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0F1115' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <PageComponent />
      </main>
    </div>
  );
}
