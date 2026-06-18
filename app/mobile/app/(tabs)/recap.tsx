import { useRouter } from 'expo-router';
import { FerrisWheel } from 'lucide-react-native';
import { View } from 'react-native';

import { BackHomeButton } from '@/components/BackHomeButton';
import { ScreenEyebrow } from '@/components/ScreenEyebrow';
import { Screen } from '@/components/Screen';
import { SessionGate } from '@/components/SessionGate';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

function RecapContent({ code }: { code: string }) {
  const router = useRouter();

  return (
    <Screen scroll>
      <ScreenEyebrow>Session recap</ScreenEyebrow>
      <Text variant="display" weight="extrabold" className="mt-1 text-[28px] text-ink">
        Tonight&apos;s spins
      </Text>

      <View className="mt-4 flex-row gap-2.5">
        <View className="flex-1 rounded-[15px] border-[2.5px] border-ink bg-ink p-3">
          <Text variant="display" weight="extrabold" className="text-[24px] text-paper">
            0
          </Text>
          <Text variant="body" weight="bold" className="mt-0.5 text-[11px] text-paper/85">
            spins
          </Text>
        </View>
        <View
          className="flex-1 rounded-[15px] border-[2.5px] border-ink bg-success p-3"
          style={{ shadowColor: '#3A2A24', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }}
        >
          <Text variant="display" weight="extrabold" className="text-[24px] text-white">
            0
          </Text>
          <Text variant="body" weight="bold" className="mt-0.5 text-[11px] text-white/90">
            accepted
          </Text>
        </View>
        <View className="flex-1 rounded-[15px] border-[2.5px] border-ink bg-surface p-3">
          <Text variant="display" weight="extrabold" className="text-[24px] text-ink">
            0
          </Text>
          <Text variant="body" weight="bold" className="mt-0.5 text-[11px] text-subtle">
            passed
          </Text>
        </View>
      </View>

      <Card className="mt-4 border-dashed border-[#C9B6A1]">
        <CardContent className="items-center gap-2 py-10">
          <FerrisWheel size={38} color="#3A2A24" strokeWidth={2.5} />
          <Text variant="display" weight="extrabold" className="text-lg text-ink">
            No spins yet
          </Text>
          <Text variant="body" weight="bold" className="text-center text-sm text-subtle">
            Give the wheel a whirl.
          </Text>
          <Button className="mt-3 px-6" onPress={() => router.push('/(tabs)/spin')}>
            Go spin
          </Button>
        </CardContent>
      </Card>

      <Text variant="body" weight="semibold" className="mt-4 text-center text-xs text-muted">
        Session {code}
      </Text>

      <View className="mt-6">
        <BackHomeButton />
      </View>
    </Screen>
  );
}

export default function RecapTab() {
  return <SessionGate>{(code) => <RecapContent code={code} />}</SessionGate>;
}
