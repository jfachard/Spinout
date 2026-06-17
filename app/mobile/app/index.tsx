import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

export default function HomeScreen() {
  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Spinout' }} />

      <View className="gap-6">
        <View className="gap-2">
          <Text variant="display" weight="extrabold" className="text-4xl leading-tight text-ink">
            Stop asking{'\n'}&ldquo;what do we{'\n'}wanna do?&rdquo;
          </Text>
          <Text variant="body" className="text-lg text-subtle">
            Gather your crew, spin the wheel, and let fate pick the plan.
          </Text>
        </View>

        <View className="gap-3">
          <Button>Create a session</Button>
          <Button variant="secondary">Join with a code</Button>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {[
            { title: 'Spin the wheel', desc: 'Fate picks the activity.' },
            { title: 'Everyone votes', desc: 'Yes or no, live.' },
            { title: 'Just go', desc: 'No more debating.' },
          ].map((feature) => (
            <Card key={feature.title} className="min-w-[140px] flex-1">
              <CardContent className="gap-1.5 p-4">
                <Text variant="display" weight="bold" className="text-ink">
                  {feature.title}
                </Text>
                <Text variant="body" className="text-sm text-subtle">
                  {feature.desc}
                </Text>
              </CardContent>
            </Card>
          ))}
        </View>

        <Link href="/session/DEMO01/lobby" asChild>
          <Button variant="secondary">Demo lobby (DEMO01)</Button>
        </Link>
      </View>
    </Screen>
  );
}
