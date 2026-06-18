import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { getMembership } from '@/lib/session';

export function useSessionCode() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getMembership().then((membership) => {
        if (active) {
          setCode(membership?.code ?? null);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return { code, loading };
}

export function SessionGate({ children }: { children: (code: string) => ReactNode }) {
  const { code, loading } = useSessionCode();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator size="large" color="#e8643c" />
      </View>
    );
  }

  if (!code) {
    return (
      <Screen scroll centered>
        <Text variant="display" weight="extrabold" className="text-center text-2xl text-ink">
          No session yet
        </Text>
        <Text variant="body" weight="semibold" className="mt-2 text-center text-subtle">
          Create or join one from Home.
        </Text>
        <Link href="/" asChild>
          <Button className="mt-6 px-8">Go home</Button>
        </Link>
      </Screen>
    );
  }

  return <>{children(code)}</>;
}
