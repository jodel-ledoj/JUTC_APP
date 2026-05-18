import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket';
import { OccupancyReading } from '../constants/occupancy';

const OCCUPANCY_UPDATE_EVENT = 'occupancy:update';

/**
 * Subscribes to real-time occupancy updates via Socket.io.
 * Maintains a per-busId map of the latest reading.
 * Falls back gracefully when socket is unavailable.
 */
export function useOccupancy(): Record<string, OccupancyReading> {
  const [readings, setReadings] = useState<Record<string, OccupancyReading>>({});
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const socket = await getSocket();
        socketRef.current = socket;

        socket.on(OCCUPANCY_UPDATE_EVENT, (reading: OccupancyReading) => {
          if (!mounted) return;
          setReadings((prev) => ({ ...prev, [reading.busId]: reading }));
        });
      } catch {
        // Socket unavailable — occupancy will remain empty, UI degrades gracefully
      }
    })();

    return () => {
      mounted = false;
      socketRef.current?.off(OCCUPANCY_UPDATE_EVENT);
    };
  }, []);

  return readings;
}
