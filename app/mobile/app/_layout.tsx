import '../global.css';

import {
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts as useBalooFonts,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts as useNunitoFonts,
} from '@expo-google-fonts/nunito';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isReady, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    const root = segments[0];
    const onHome = !root;
    const inTabs = root === '(tabs)';
    const inAuthGroup = root === 'auth';
    const inSession = root === 'session';
    const inJoin = root === 'join';
    const isPublic = onHome || inTabs || inAuthGroup || inSession || inJoin;

    if (!isAuthenticated && !isPublic) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isReady, router, segments]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#e8643c" />
      </View>
    );
  }

  return children;
}

function RootNavigation() {
  return (
    <AuthGuard>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fbf3e4' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="join" />
        <Stack.Screen name="session" />
      </Stack>
    </AuthGuard>
  );
}

export default function Layout() {
  const [balooLoaded] = useBalooFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });
  const [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!balooLoaded || !nunitoLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#e8643c" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
