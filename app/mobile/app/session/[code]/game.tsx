import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: `Game — ${code}` }} />

      <Card>
        <CardContent className="gap-4">
          <Text variant="display" weight="bold" className="text-2xl text-ink">
            Game
          </Text>
          <Text variant="body" className="text-subtle">
            Session <Text variant="body" weight="bold">{code}</Text> — wheel + vote UI coming soon.
          </Text>

          <View className="gap-3 pt-2">
            <Link href={`/session/${code}/lobby`} asChild>
              <Button variant="secondary">Back to lobby</Button>
            </Link>
          </View>
        </CardContent>
      </Card>
    </Screen>
  );
}
