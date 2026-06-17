import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: `Lobby — ${code}` }} />

      <Card>
        <CardContent className="gap-4">
          <Text variant="display" weight="bold" className="text-2xl text-ink">
            Session lobby
          </Text>
          <Text variant="body" className="text-subtle">
            Code: <Text variant="body" weight="bold">{code}</Text>
          </Text>
          <Text variant="body" className="text-subtle">
            Placeholder — lobby UI arrives in the next milestone issue.
          </Text>

          <View className="gap-3 pt-2">
            <Link href={`/session/${code}/game`} asChild>
              <Button>Go to game</Button>
            </Link>
            <Link href={`/session/${code}/history`} asChild>
              <Button variant="secondary">View history</Button>
            </Link>
            <Link href="/" asChild>
              <Button variant="secondary">Back home</Button>
            </Link>
          </View>
        </CardContent>
      </Card>
    </Screen>
  );
}
