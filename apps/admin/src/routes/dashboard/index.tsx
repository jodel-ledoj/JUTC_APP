import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Bus, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { api } from '../../lib/api';
import { getAdminSocket } from '../../lib/socket';
import { SOCKET_EVENTS } from '@jutc/shared';
import KpiCard from '../../components/ui/KpiCard';

export default function FleetOverview() {
  const [busPositions, setBusPositions] = useState<Map<string, any>>(new Map());

  const { data: fleet } = useQuery({
    queryKey: ['admin', 'fleet'],
    queryFn: async () => (await api.get('/admin/fleet')).data.data,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const socket = getAdminSocket();
    socket.on(SOCKET_EVENTS.GPS_UPDATE, ({ position }: any) => {
      setBusPositions((prev) => new Map(prev).set(position.busId, position));
    });
    return () => { socket.off(SOCKET_EVENTS.GPS_UPDATE); };
  }, []);

  const createBusIcon = (routeCode: string, color: string = '#2F80ED') =>
    divIcon({
      html: `<div style="background:${color};color:#fff;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap">${routeCode}</div>`,
      className: '',
    });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Fleet Overview</h1>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <KpiCard title="Active Buses" value={fleet?.activeBuses ?? 0} color="#27AE60" icon={<Bus size={20} />} />
        <KpiCard title="Delayed Trips" value={fleet?.delayedTrips ?? 0} color="#F2C94C" icon={<Clock size={20} />} subtitle="10+ min late" />
        <KpiCard title="Out of Service" value={fleet?.outOfService ?? 0} color="#B6BDC9" icon={<TrendingDown size={20} />} />
        <KpiCard title="Breakdowns" value={fleet?.breakdown ?? 0} color="#EB5757" icon={<AlertTriangle size={20} />} />
      </div>

      {/* Map */}
      <div style={{ height: 480, borderRadius: 12, overflow: 'hidden', border: '1px solid #2A2F38', marginBottom: 24 }}>
        <MapContainer
          center={[17.9714, -76.7936]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {Array.from(busPositions.values()).map((pos) => (
            <Marker
              key={pos.busId}
              position={[pos.latitude, pos.longitude]}
              icon={createBusIcon(pos.routeCode ?? 'BUS', '#2F80ED')}
            >
              <Popup>
                <div style={{ background: '#1A1D23', color: '#F5F7FA', padding: 8, borderRadius: 8 }}>
                  <strong>{pos.plateNumber}</strong><br />
                  Route: {pos.routeCode ?? 'Unknown'}<br />
                  Speed: {Math.round(pos.speed ?? 0)} km/h<br />
                  Updated: {new Date(pos.timestamp).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Active Trips Table */}
      <div style={{ background: '#1A1D23', borderRadius: 12, border: '1px solid #2A2F38', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2F38' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Active Trips</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2F38' }}>
              {['Bus', 'Route', 'Driver', 'Status', 'Passengers'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#B6BDC9', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fleet?.activeTrips?.map((trip: any) => (
              <tr key={trip.id} style={{ borderBottom: '1px solid #2A2F38' }}>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{trip.bus?.plateNumber}</td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{trip.route?.code} — {trip.route?.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{trip.driver?.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: trip.status === 'EN_ROUTE' ? '#27AE6022' : '#F2C94C22',
                    color: trip.status === 'EN_ROUTE' ? '#27AE60' : '#F2C94C',
                    borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600,
                  }}>
                    {trip.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{trip.passengerCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!fleet?.activeTrips?.length && (
          <p style={{ padding: 24, textAlign: 'center', color: '#B6BDC9' }}>No active trips</p>
        )}
      </div>
    </div>
  );
}
