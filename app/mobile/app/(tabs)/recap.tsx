import { useRouter } from 'expo-router';
import {
  Check,
  Disc3,
  Dumbbell,
  FerrisWheel,
  Flower2,
  House,
  Palette,
  PartyPopper,
  RotateCcw,
  TreePine,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { BackHomeButton } from '@/components/BackHomeButton';
import { ScreenEyebrow } from '@/components/ScreenEyebrow';
import { Screen } from '@/components/Screen';
import { SessionGate } from '@/components/SessionGate';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CATEGORY_META, type CategoryKey } from '@/components/ui/CategoryChip';
import { Text } from '@/components/ui/Text';
import { isCategoryKey } from '@/lib/game';
import {
  fetchSessionHistory,
  getStoredSessionHistory,
  storeSessionHistory,
  type HistorySpin,
} from '@/lib/session';
import { cn } from '@/lib/utils';

const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  indoor: House,
  outdoor: TreePine,
  sport: Dumbbell,
  relaxation: Flower2,
  party: PartyPopper,
  culture: Palette,
  food: UtensilsCrossed,
};

function RecapContent({ code }: { code: string }) {
  const router = useRouter();
  const [spins, setSpins] = useState<HistorySpin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cached = await getStoredSessionHistory<HistorySpin[]>(code);
    if (cached?.length) {
      setSpins(cached);
      setLoading(false);
    }

    try {
      const data = await fetchSessionHistory(code);
      setSpins(data.spins);
      await storeSessionHistory(code, data.spins);
    } catch (err) {
      if (!cached?.length) {
        setError(err instanceof Error ? err.message : 'Session not found');
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const acceptedCount = spins.filter((s) => s.result === 'accepted').length;
  const passedCount = spins.length - acceptedCount;

  return (
    <Screen scroll>
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <ScreenEyebrow>Session recap</ScreenEyebrow>
          <Text variant="display" weight="extrabold" className="mt-1 text-[28px] text-ink">
            Tonight&apos;s spins
          </Text>
        </View>
        {spins.length > 0 ? (
          <Button
            variant="secondary"
            className="px-4 py-3"
            textClassName="text-sm"
            icon={<RotateCcw size={16} color="#3A2A24" strokeWidth={2.5} />}
            onPress={() => router.push('/(tabs)/spin')}
          >
            Spin again
          </Button>
        ) : null}
      </View>

      {spins.length > 0 ? (
        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1 rounded-[15px] border-[2.5px] border-ink bg-ink p-3">
            <Text variant="display" weight="extrabold" className="text-[24px] text-paper">
              {spins.length}
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
              {acceptedCount}
            </Text>
            <Text variant="body" weight="bold" className="mt-0.5 text-[11px] text-white/90">
              accepted
            </Text>
          </View>
          <View className="flex-1 rounded-[15px] border-[2.5px] border-ink bg-surface p-3">
            <Text variant="display" weight="extrabold" className="text-[24px] text-ink">
              {passedCount}
            </Text>
            <Text variant="body" weight="bold" className="mt-0.5 text-[11px] text-subtle">
              passed
            </Text>
          </View>
        </View>
      ) : null}

      {loading && spins.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="items-center py-12">
            <ActivityIndicator size="large" color="#e8643c" />
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="mt-4">
          <CardContent className="items-center gap-3 py-10">
            <Text variant="body" weight="semibold" className="text-center text-subtle">
              {error}
            </Text>
            <BackHomeButton />
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && spins.length === 0 ? (
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
      ) : null}

      {spins.length > 0 ? (
        <View className="mt-4 gap-3">
          {spins.map((spin) => {
            const yes = spin.votes.filter((v) => v.value).length;
            const no = spin.votes.length - yes;
            const accepted = spin.result === 'accepted';
            const catKey = isCategoryKey(spin.activity.category) ? spin.activity.category : null;
            const catMeta = catKey ? CATEGORY_META[catKey] : null;
            const CatIcon = catKey ? CATEGORY_ICON[catKey] : null;

            return (
              <View
                key={spin.id}
                className="flex-row items-center gap-3 rounded-[18px] border-[2.5px] border-ink bg-surface px-4 py-4"
                style={{ shadowColor: '#3A2A24', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }}
              >
                <View
                  className="h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[2.5px] border-ink"
                  style={{ backgroundColor: catMeta?.color ?? '#E8643C' }}
                >
                  {CatIcon ? (
                    <CatIcon size={26} color="#FFFCF6" strokeWidth={2.5} />
                  ) : (
                    <Disc3 size={26} color="#FFFCF6" strokeWidth={2.5} />
                  )}
                </View>

                <View className="min-w-0 flex-1">
                  <Text variant="display" weight="extrabold" className="text-lg text-ink" numberOfLines={1}>
                    {spin.activity.title}
                  </Text>
                  <Text variant="body" weight="bold" className="mt-0.5 text-xs text-muted">
                    {catMeta?.label ?? spin.activity.category} · 👍{yes} · 👎{no}
                  </Text>
                </View>

                {accepted ? (
                  <View className="flex-row items-center gap-1 rounded-full border-[2.5px] border-ink bg-success px-3 py-1.5">
                    <Check size={11} color="#fff" strokeWidth={3} />
                    <Text variant="body" weight="extrabold" className="text-xs text-white">
                      Accepted
                    </Text>
                  </View>
                ) : (
                  <View
                    className={cn(
                      'rounded-full border-[2.5px] border-dashed border-[#C9836A] bg-surface px-3 py-1.5',
                    )}
                  >
                    <Text variant="body" weight="extrabold" className="text-xs text-[#C9533A]">
                      Passed
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}

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
