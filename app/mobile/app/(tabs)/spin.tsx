import { View } from 'react-native';

import { HeroWheel } from '@/components/HeroWheel';
import { ScreenEyebrow } from '@/components/ScreenEyebrow';
import { Screen } from '@/components/Screen';
import { SessionGate } from '@/components/SessionGate';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

function SpinContent({ code }: { code: string }) {
  return (
    <Screen scroll contentClassName="items-center">
      <View className="w-full">
        <ScreenEyebrow>Round 1</ScreenEyebrow>
        <Text variant="display" weight="extrabold" className="mt-1 text-center text-2xl text-ink">
          Tap to let fate decide
        </Text>
      </View>

      <View className="my-6">
        <HeroWheel size={220} />
      </View>

      <Button className="px-12" textClassName="text-xl" onPress={() => {}}>
        SPIN
      </Button>

      <Text variant="body" weight="semibold" className="mt-6 text-center text-sm text-subtle">
        Wheel + vote UI coming soon for session {code}.
      </Text>
    </Screen>
  );
}

export default function SpinTab() {
  return <SessionGate>{(code) => <SpinContent code={code} />}</SessionGate>;
}
