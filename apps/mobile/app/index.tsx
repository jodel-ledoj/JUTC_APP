import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { Colors } from '../constants/colors';

export default function Index() {
  const { isHydrating, isAuthenticated, user, hydrateAuth } = useAuthStore();

  useEffect(() => {
    hydrateAuth();
  }, []);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const isDriver = user?.role === 'DRIVER' || user?.role === 'CONDUCTOR';
  return <Redirect href={isDriver ? '/(driver)' : '/(passenger)'} />;
}
