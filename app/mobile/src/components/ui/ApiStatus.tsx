import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { API_URL } from '@/lib/api';
import { Text } from '@/components/ui/Text';

type Status = 'checking' | 'online' | 'offline';

export function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(`${API_URL}/`, { method: 'GET', signal: controller.signal });
        clearTimeout(timeout);
        if (!cancelled) setStatus('online');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    }

    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (status === 'checking') return null;

  return (
    <View className="flex-row items-center mt-2 justify-center gap-2">
      <View
        className={`h-2 w-2 rounded-full ${
          status === "online" ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <Text
        variant="body"
        weight="bold"
        className="text-xs uppercase tracking-widest text-subtle"
      >
        Authentication server: {status}
      </Text>
    </View>
  );
}