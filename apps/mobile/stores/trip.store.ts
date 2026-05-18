import { create } from 'zustand';

interface TripState {
  activeTripId: string | null;
  activeRouteId: string | null;
  activeBusId: string | null;
  shiftStartTime: Date | null;
  tripCount: number;
  totalFaresCollectedJMD: number;
  setActiveTrip: (tripId: string, routeId: string, busId: string) => void;
  incrementFares: (amount: number) => void;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTripId: null,
  activeRouteId: null,
  activeBusId: null,
  shiftStartTime: null,
  tripCount: 0,
  totalFaresCollectedJMD: 0,

  setActiveTrip: (tripId, routeId, busId) =>
    set((s) => ({
      activeTripId: tripId,
      activeRouteId: routeId,
      activeBusId: busId,
      shiftStartTime: s.shiftStartTime ?? new Date(),
    })),

  incrementFares: (amount) =>
    set((s) => ({ totalFaresCollectedJMD: s.totalFaresCollectedJMD + amount })),

  clearTrip: () =>
    set((s) => ({
      activeTripId: null,
      activeRouteId: null,
      activeBusId: null,
      tripCount: s.tripCount + 1,
    })),
}));
