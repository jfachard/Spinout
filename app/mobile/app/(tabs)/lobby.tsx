import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { View } from 'react-native';

import { BackHomeButton } from '@/components/BackHomeButton';
import { ScreenEyebrow } from '@/components/ScreenEyebrow';
import { Screen } from '@/components/Screen';
import { SessionGate } from '@/components/SessionGate';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

function LobbyContent({ code }: { code: string }) {
  const router = useRouter();

  return (
    <Screen scroll>
      <ScreenEyebrow>Lobby · {code}</ScreenEyebrow>
      <Text variant="display" weight="extrabold" className="mt-1 text-[28px] text-ink">
        Crew check
      </Text>

      <Card className="mt-5">
        <CardContent className="gap-4 p-4">
          <View className="flex-row items-center justify-between">
            <Text variant="display" weight="extrabold" className="text-base text-ink">
              In the lobby
            </Text>
            <View className="flex-row items-center gap-1 rounded-full border-2 border-ink bg-amber px-2.5 py-0.5">
              <Users size={12} color="#3A2A24" strokeWidth={2.5} />
              <Text variant="body" weight="extrabold" className="text-xs text-ink">
                —
              </Text>
            </View>
          </View>
          <Text variant="body" weight="semibold" className="text-sm text-subtle">
            Lobby UI arrives in the next milestone — members, categories, and vibes.
          </Text>
        </CardContent>
      </Card>

      <View className="mt-6 gap-3">
        <Button onPress={() => router.push('/(tabs)/spin')}>Start the spin</Button>
        <BackHomeButton />
      </View>
    </Screen>
  );
}

export default function LobbyTab() {
  return <SessionGate>{(code) => <LobbyContent code={code} />}</SessionGate>;
}
