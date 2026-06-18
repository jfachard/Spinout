import {
  Check,
  Disc3,
  Dumbbell,
  Flower2,
  House,
  Palette,
  PartyPopper,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  TreePine,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { BackHomeButton } from '@/components/BackHomeButton';
import { GameWheel } from '@/components/GameWheel';
import { ScreenEyebrow } from '@/components/ScreenEyebrow';
import { Screen } from '@/components/Screen';
import { SessionGate } from '@/components/SessionGate';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CATEGORY_META, type CategoryKey } from '@/components/ui/CategoryChip';
import { StickerPressable } from '@/components/ui/StickerPressable';
import { Text } from '@/components/ui/Text';
import { useGame } from '@/contexts/GameContext';
import { isCategoryKey, MIN_SPIN_MS } from '@/lib/game';
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

function SpinScreenContent() {
  const {
    connecting,
    error,
    phase,
    spinning,
    activity,
    votes,
    myVote,
    voteResult,
    closing,
    isHost,
    memberCount,
    spin,
    castVote,
    closeSession,
  } = useGame();

  if (error) {
    return (
      <Screen scroll centered>
        <Text variant="display" weight="extrabold" className="text-center text-2xl text-ink">
          Oops
        </Text>
        <Text variant="body" weight="semibold" className="mt-2 text-center text-subtle">
          {error}
        </Text>
        <View className="mt-6">
          <BackHomeButton />
        </View>
      </Screen>
    );
  }

  const catMeta =
    activity && isCategoryKey(activity.category) ? CATEGORY_META[activity.category] : null;
  const CatIcon =
    activity && isCategoryKey(activity.category) ? CATEGORY_ICON[activity.category] : null;

  const canSpin =
    isHost &&
    phase !== 'spinning' &&
    phase !== 'voting' &&
    !(phase === 'result' && voteResult === 'accepted');

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <ScreenEyebrow>{connecting ? 'Connecting…' : 'Game on'}</ScreenEyebrow>
          <Text variant="display" weight="extrabold" className="mt-1 text-[28px] text-ink">
            Spin!
          </Text>
        </View>
        {isHost ? (
          <Button
            variant="secondary"
            className="px-4 py-3"
            textClassName="text-sm"
            onPress={closeSession}
            disabled={closing || connecting}
            loading={closing}
          >
            End session
          </Button>
        ) : null}
      </View>

      <View className="mt-6 items-center gap-5">
        <GameWheel size={240} spinning={spinning} durationMs={MIN_SPIN_MS} />

        {canSpin ? (
          <StickerPressable
            shadowSize="lg"
            onPress={spin}
            disabled={connecting}
            className="flex-row items-center gap-2 rounded-[18px] border-[3px] border-ink bg-amber px-12 py-4"
          >
            {voteResult === 'rejected' ? (
              <>
                <RotateCcw size={22} color="#3A2A24" strokeWidth={2.5} />
                <Text variant="display" weight="extrabold" className="text-2xl text-ink">
                  Spin again
                </Text>
              </>
            ) : (
              <>
                <Disc3 size={24} color="#3A2A24" strokeWidth={2.5} />
                <Text variant="display" weight="extrabold" className="text-2xl text-ink">
                  SPIN
                </Text>
              </>
            )}
          </StickerPressable>
        ) : null}

        {!isHost && phase === 'idle' ? (
          <Text variant="body" weight="semibold" className="text-center text-sm text-subtle">
            Waiting for the host to spin…
          </Text>
        ) : null}
      </View>

      <View className="mt-6 gap-4">
        {phase === 'spinning' ? (
          <Card>
            <CardContent className="items-center gap-3 py-10">
              <ActivityIndicator size="large" color="#e8643c" />
              <Text variant="display" weight="bold" className="text-xl text-ink">
                Round and round… 🌀
              </Text>
            </CardContent>
          </Card>
        ) : null}

        {activity && phase !== 'idle' && phase !== 'spinning' ? (
          <View
            className="items-center rounded-[22px] border-[3px] border-ink p-6"
            style={{
              backgroundColor: catMeta?.color ?? '#E8643C',
              shadowColor: '#3A2A24',
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <View className="rounded-full border-2 border-ink bg-surface px-3 py-1">
              <Text variant="body" weight="extrabold" className="text-xs uppercase text-ink">
                {catMeta?.label ?? activity.category}
              </Text>
            </View>
            <View className="my-4">
              {CatIcon ? (
                <CatIcon size={52} color="#FFFCF6" strokeWidth={2} />
              ) : (
                <Text className="text-5xl">🎲</Text>
              )}
            </View>
            <Text variant="display" weight="extrabold" className="text-center text-3xl text-white">
              {activity.title}
            </Text>
            {activity.tags.length > 0 ? (
              <View className="mt-4 flex-row flex-wrap justify-center gap-1.5">
                {activity.tags.map((tag) => (
                  <View key={tag} className="rounded-full bg-white/25 px-2.5 py-1">
                    <Text variant="body" weight="bold" className="text-xs text-white">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === 'voting' && activity ? (
          <View className="flex-row gap-3">
            <StickerPressable
              shadowSize="md"
              onPress={() => castVote(false)}
              disabled={myVote !== null}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-surface py-4',
                myVote !== null && 'opacity-50',
              )}
            >
              <ThumbsDown size={20} color="#3A2A24" strokeWidth={2.5} />
              <Text variant="display" weight="extrabold" className="text-xl text-ink">
                Nope
              </Text>
            </StickerPressable>
            <StickerPressable
              shadowSize="md"
              onPress={() => castVote(true)}
              disabled={myVote !== null}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-[3px] border-ink bg-success py-4',
                myVote !== null && 'opacity-50',
              )}
            >
              <ThumbsUp size={20} color="#fff" strokeWidth={2.5} />
              <Text variant="display" weight="extrabold" className="text-xl text-white">
                Yes!
              </Text>
            </StickerPressable>
          </View>
        ) : null}

        {phase === 'voting' && myVote !== null ? (
          <Card>
            <CardContent className="gap-3 p-4">
              <View className="flex-row items-center justify-between">
                <Text variant="display" weight="bold" className="text-lg text-ink">
                  {votes.total}/{memberCount} voted
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-row items-center gap-1 rounded-full border-2 border-ink bg-success px-3 py-1">
                    <ThumbsUp size={13} color="#fff" strokeWidth={2.5} />
                    <Text variant="body" weight="extrabold" className="text-sm text-white">
                      {votes.yes}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 rounded-full border-2 border-ink bg-paper px-3 py-1">
                    <ThumbsDown size={13} color="#3A2A24" strokeWidth={2.5} />
                    <Text variant="body" weight="extrabold" className="text-sm text-ink">
                      {votes.no}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="h-3 flex-row overflow-hidden rounded-full border-2 border-ink bg-paper">
                <View
                  className="bg-success"
                  style={{ width: memberCount ? `${(votes.yes / memberCount) * 100}%` : '0%' }}
                />
                <View
                  className="bg-[#C9533A]"
                  style={{ width: memberCount ? `${(votes.no / memberCount) * 100}%` : '0%' }}
                />
              </View>
              <Text variant="body" weight="semibold" className="text-center text-sm text-muted">
                You voted {myVote ? 'yes' : 'no'} — waiting for others…
              </Text>
            </CardContent>
          </Card>
        ) : null}

        {voteResult === 'accepted' ? (
          <View
            className="items-center rounded-[18px] border-[3px] border-ink p-6"
            style={{
              backgroundColor: '#7A9A52',
              shadowColor: '#3A2A24',
              shadowOffset: { width: 5, height: 5 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <View className="flex-row items-center gap-3">
              <Check size={28} color="#fff" strokeWidth={3} />
              <Text variant="display" weight="extrabold" className="text-3xl text-white">
                It&apos;s a yes!
              </Text>
            </View>
            <Text variant="body" weight="bold" className="mt-1 text-center text-base text-white/95">
              {votes.yes} of {memberCount} are in. Grab your stuff — let&apos;s gooo.
            </Text>
            <View className="mt-5 w-full flex-row gap-3">
              {isHost ? (
                <Button variant="secondary" className="flex-1 py-3" onPress={spin} disabled={connecting}>
                  Spin again
                </Button>
              ) : null}
              <Button
                variant="dark"
                className="flex-1 py-3"
                onPress={closeSession}
                disabled={closing}
                loading={closing}
              >
                See recap →
              </Button>
            </View>
          </View>
        ) : null}

        {voteResult === 'rejected' ? (
          <View
            className="items-center rounded-[18px] border-[3px] border-dashed border-[#C9836A] bg-surface p-6"
            style={{
              shadowColor: '#DCC9B6',
              shadowOffset: { width: 5, height: 5 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <View className="flex-row items-center gap-2">
              <X size={22} color="#C9533A" strokeWidth={3} />
              <Text variant="display" weight="extrabold" className="text-2xl text-[#C9533A]">
                Not it
              </Text>
            </View>
            <Text variant="body" weight="bold" className="mt-1 text-center text-base text-subtle">
              Only {votes.yes} of {memberCount} said yes. Give the wheel another whirl.
            </Text>
            {isHost ? (
              <Button className="mt-5 px-8" onPress={spin} disabled={connecting}>
                Spin again
              </Button>
            ) : null}
          </View>
        ) : null}

        {phase === 'idle' && !activity ? (
          <Card>
            <CardContent className="py-8">
              <Text variant="body" weight="semibold" className="text-center text-subtle">
                {isHost
                  ? 'Hit SPIN when everyone is ready.'
                  : 'The wheel will spin when the host starts.'}
              </Text>
            </CardContent>
          </Card>
        ) : null}
      </View>

      <View className="mt-6">
        <BackHomeButton />
      </View>
    </Screen>
  );
}

export default function SpinTab() {
  return (
    <SessionGate>
      {() => <SpinScreenContent />}
    </SessionGate>
  );
}
