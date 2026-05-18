import { Tabs } from 'expo-router';
import { Home, Navigation, ScanLine, AlertTriangle } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.divider,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Shift', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="route" options={{ title: 'Route', tabBarIcon: ({ color }) => <Navigation size={22} color={color} /> }} />
      <Tabs.Screen name="validate" options={{ title: 'Validate', tabBarIcon: ({ color }) => <ScanLine size={22} color={color} /> }} />
      <Tabs.Screen name="report" options={{ title: 'Report', tabBarIcon: ({ color }) => <AlertTriangle size={22} color={color} /> }} />
    </Tabs>
  );
}
