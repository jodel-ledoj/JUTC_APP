import React from 'react';
import { useAuthStore } from './stores/auth.store';
import Login from './routes/login';
import DashboardLayout from './components/layout/DashboardLayout';

export default function App() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <DashboardLayout /> : <Login />;
}
