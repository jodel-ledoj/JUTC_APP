import { Tabs } from 'expo-router';
import { Home, MapPin, CreditCard, Bell, List } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

const ICON_SIZE = 22;
const ICON_STROKE = 1.8;

export default function PassengerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color }) => <List size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Track',
          tabBarIcon: ({ color }) => <MapPin size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />,
        }}
      />
      <Tabs.Screen
        name="smartcard"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <CreditCard size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <Bell size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{ href: null }}
      />
    </Tabs>
  );
}
