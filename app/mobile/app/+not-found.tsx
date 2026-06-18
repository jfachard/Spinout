import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <Screen centered>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="items-center gap-4">
        <Text variant="display" weight="bold" className="text-2xl text-ink">
          This screen doesn&apos;t exist.
        </Text>
        <Link href="/" asChild>
          <Button variant="secondary">Go home</Button>
        </Link>
      </View>
    </Screen>
  );
}
