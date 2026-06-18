import * as Clipboard from 'expo-clipboard';
import {
  Check,
  Copy,
  Disc3,
  Dumbbell,
  Flower2,
  House,
  Link2,
  Palette,
  PartyPopper,
  Share2,
  ThumbsDown,
  ThumbsUp,
  TreePine,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';

import { BackHomeButton } from '@/components/BackHomeButton';
import { ScreenEyebrow } from '@/components/ScreenEyebrow';
import { Screen } from '@/components/Screen';
import { SessionGate } from '@/components/SessionGate';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CATEGORY_META, type CategoryKey } from '@/components/ui/CategoryChip';
import { StickerPressable } from '@/components/ui/StickerPressable';
import { Text } from '@/components/ui/Text';
import { useLobby } from '@/contexts/LobbyContext';
import {
  CATEGORY_KEYS,
  CATEGORY_TAGS,
  MEMBER_COLORS,
  memberName,
} from '@/lib/lobby';
import { getJoinUrl } from '@/lib/join';
import { cn } from '@/lib/utils';

function WhatsAppIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="#fff">
      <Path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.973-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </Svg>
  );
}

const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  indoor: House,
  outdoor: TreePine,
  sport: Dumbbell,
  relaxation: Flower2,
  party: PartyPopper,
  culture: Palette,
  food: UtensilsCrossed,
};

function LobbyScreenContent({ code }: { code: string }) {
  const {
    session,
    members,
    myMemberId,
    readyIds,
    connecting,
    error,
    starting,
    isHost,
    activeCategory,
    tagStates,
    savedCategories,
    selectCategory,
    cycleTag,
    savePreference,
    cancelPreference,
    start,
  } = useLobby();

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const joinUrl = useMemo(() => getJoinUrl(code), [code]);

  const shareText = useMemo(() => `Join my Spinout session! Code: ${code}`, [code]);

  async function copyCode() {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function copyLink() {
    await Clipboard.setStringAsync(joinUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  async function nativeShare() {
    try {
      await Share.share({
        message: `${shareText}\n${joinUrl}`,
        url: joinUrl,
      });
    } catch {
      /* cancelled */
    }
  }

  async function shareWhatsApp() {
    const text = encodeURIComponent(`${shareText}\n${joinUrl}`);
    await Linking.openURL(`https://wa.me/?text=${text}`);
  }

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

  return (
    <Screen scroll>
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <ScreenEyebrow>
            {connecting ? 'Connecting…' : `Lobby · ${code}`}
          </ScreenEyebrow>
          <Text variant="display" weight="extrabold" className="mt-1 text-[28px] text-ink">
            Get the crew together
          </Text>
        </View>
        {isHost ? (
          <Button
            className="px-4 py-3"
            textClassName="text-base"
            onPress={start}
            disabled={starting || members.length < 1}
            loading={starting}
            icon={!starting ? <Disc3 size={18} color="#fff" strokeWidth={2.5} /> : undefined}
          >
            {starting ? 'Starting…' : 'Start the spin'}
          </Button>
        ) : null}
      </View>

      {connecting ? (
        <View className="mt-10 items-center">
          <ActivityIndicator size="large" color="#e8643c" />
        </View>
      ) : null}

      <Card className="mt-5">
        <CardContent className="gap-4 p-4">
          <View className="flex-row items-center gap-2">
            <Users size={20} color="#3A2A24" strokeWidth={2.5} />
            <Text variant="display" weight="extrabold" className="text-lg text-ink">
              In the lobby{members.length > 0 ? ` (${members.length})` : ''}
            </Text>
          </View>

          {members.length === 0 ? (
            <Text variant="body" weight="semibold" className="text-sm text-muted">
              No one here yet.
            </Text>
          ) : (
            members.map((m, idx) => {
              const host = !!m.userId && m.userId === session?.hostId;
              const ready = readyIds.has(m.id);
              const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];

              return (
                <View key={m.id} className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-ink"
                    style={{
                      backgroundColor: color,
                      shadowColor: '#3A2A24',
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: 1,
                      shadowRadius: 0,
                    }}
                  >
                    <Text variant="display" weight="extrabold" className="text-sm text-white">
                      {memberName(m).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text variant="body" weight="bold" className="flex-1 text-sm text-ink">
                    {memberName(m)}
                    {m.id === myMemberId ? (
                      <Text variant="body" weight="semibold" className="text-muted">
                        {' '}
                        (you)
                      </Text>
                    ) : null}
                  </Text>
                  {host ? (
                    <View className="rounded-full bg-ink px-2 py-0.5">
                      <Text variant="body" weight="extrabold" className="text-[10px] text-paper">
                        HOST
                      </Text>
                    </View>
                  ) : (
                    <View
                      className={cn(
                        'rounded-full border-[1.5px] border-ink px-2 py-0.5',
                        ready ? 'bg-success' : 'bg-surface',
                      )}
                    >
                      <Text
                        variant="body"
                        weight="extrabold"
                        className={cn('text-[10px]', ready ? 'text-white' : 'text-muted')}
                      >
                        {ready ? 'Ready' : 'Picking…'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </CardContent>
      </Card>

      <View
        className="mt-5 items-center gap-4 rounded-[22px] border-[2.5px] border-ink p-5"
        style={{
          backgroundColor: '#3A2A24',
          shadowColor: '#C9B6A1',
          shadowOffset: { width: 5, height: 5 },
          shadowOpacity: 1,
          shadowRadius: 0,
        }}
      >
        <Text variant="display" weight="bold" className="text-lg text-paper">
          Invite the others
        </Text>

        <View className="rounded-xl border-[2.5px] border-ink bg-paper p-3">
          <QRCode value={joinUrl} size={140} color="#3a2a24" backgroundColor="#FFFCF6" />
        </View>

        <Text variant="body" weight="semibold" className="text-center text-sm text-paper/80">
          Scan to join · or share code
        </Text>
        <StickerPressable
          shadowSize="sm"
          onPress={copyCode}
          className="flex-row items-center gap-2"
        >
          <Text
            variant="display"
            weight="extrabold"
            className="text-2xl tracking-[0.18em] text-paper"
          >
            {code}
          </Text>
          {copied ? (
            <Check size={18} color="#7A9A52" strokeWidth={2.5} />
          ) : (
            <Copy size={18} color="#FFFCF6" strokeWidth={2.5} style={{ opacity: 0.5 }} />
          )}
        </StickerPressable>
        <View className="w-full flex-row gap-2">
          <Button
            variant="secondary"
            className="flex-1 py-3"
            textClassName="text-sm"
            onPress={nativeShare}
            icon={<Share2 size={16} color="#3A2A24" strokeWidth={2.5} />}
          >
            Share
          </Button>
          <StickerPressable
            shadowSize="sm"
            onPress={shareWhatsApp}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-lg border-[2.5px] border-paper bg-[#25D366] py-3"
          >
            <WhatsAppIcon />
            <Text variant="display" weight="bold" className="text-sm text-white">
              WhatsApp
            </Text>
          </StickerPressable>
          <StickerPressable
            shadowSize="sm"
            onPress={copyLink}
            className="items-center justify-center rounded-lg border-[2.5px] border-paper bg-paper px-3 py-3"
          >
            {linkCopied ? (
              <Check size={16} color="#7A9A52" strokeWidth={2.5} />
            ) : (
              <Link2 size={16} color="#3A2A24" strokeWidth={2.5} />
            )}
          </StickerPressable>
        </View>
      </View>

      <Card className="mt-5">
        <CardContent className="gap-4 p-4">
          <View>
            <Text variant="display" weight="extrabold" className="text-lg text-ink">
              What&apos;s on the wheel?
            </Text>
            <Text variant="body" weight="semibold" className="mt-1 text-sm text-subtle">
              Tap a category to set your taste for it.
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {CATEGORY_KEYS.map((cat) => {
              const meta = CATEGORY_META[cat];
              const isActive = activeCategory === cat;
              const isSaved = savedCategories.has(cat) && !isActive;
              const isColored = isActive || isSaved;
              const Icon = CATEGORY_ICON[cat];

              return (
                <StickerPressable
                  key={cat}
                  shadowSize="sm"
                  onPress={() => selectCategory(cat)}
                  className="w-[30%] items-center rounded-2xl border-[2.5px] border-ink px-2 py-4"
                  style={
                    isColored
                      ? { backgroundColor: meta.color }
                      : { backgroundColor: '#FFFCF6' }
                  }
                >
                  <Icon
                    size={26}
                    strokeWidth={2}
                    color={isColored ? '#FFFCF6' : meta.color}
                  />
                  <Text
                    variant="display"
                    weight="bold"
                    className={cn(
                      'mt-2 text-center text-sm',
                      isColored ? 'text-white' : 'text-ink',
                    )}
                  >
                    {meta.label}
                  </Text>
                  <Text
                    variant="body"
                    weight="extrabold"
                    className={cn(
                      'mt-1 text-center text-[10px] uppercase opacity-80',
                      isColored ? 'text-white' : 'text-ink',
                    )}
                  >
                    {isSaved ? 'Set' : isActive ? 'editing…' : 'tap'}
                  </Text>
                </StickerPressable>
              );
            })}
          </View>
        </CardContent>
      </Card>

      {activeCategory ? (
        <Card className="mt-4">
          <CardContent className="gap-4 p-4">
            <View>
              <View className="flex-row items-center gap-2">
                {(() => {
                  const Icon = CATEGORY_ICON[activeCategory];
                  return (
                    <Icon
                      size={20}
                      color={CATEGORY_META[activeCategory].color}
                      strokeWidth={2.5}
                    />
                  );
                })()}
                <Text variant="display" weight="bold" className="text-lg text-ink">
                  {CATEGORY_META[activeCategory].label} vibes
                </Text>
              </View>
              <View className="mt-1 flex-row flex-wrap items-center gap-1">
                <Text variant="body" weight="semibold" className="text-sm text-subtle">
                  Tap to
                </Text>
                <ThumbsUp size={13} color="#7A9A52" strokeWidth={2.5} />
                <Text variant="body" weight="semibold" className="text-sm text-subtle">
                  like, again to
                </Text>
                <ThumbsDown size={13} color="#6B5B54" strokeWidth={2.5} />
                <Text variant="body" weight="semibold" className="text-sm text-subtle">
                  avoid.
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_TAGS[activeCategory].map((tag) => {
                const state = tagStates[tag];
                return (
                  <StickerPressable
                    key={tag}
                    shadowSize="sm"
                    onPress={() => cycleTag(tag)}
                    className={cn(
                      'flex-row items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1.5',
                      state === 'like' && 'bg-success',
                      state === 'dislike' && 'border-dashed bg-paper',
                      !state && 'bg-surface',
                    )}
                  >
                    {state === 'like' ? (
                      <ThumbsUp size={13} color="#fff" strokeWidth={2.5} />
                    ) : null}
                    {state === 'dislike' ? (
                      <ThumbsDown size={13} color="#6B5B54" strokeWidth={2.5} />
                    ) : null}
                    <Text
                      variant="body"
                      weight="bold"
                      className={cn(
                        'text-sm',
                        state === 'like' && 'text-white',
                        state === 'dislike' && 'text-muted line-through',
                        !state && 'text-ink',
                      )}
                    >
                      {tag}
                    </Text>
                  </StickerPressable>
                );
              })}
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1 py-3"
                textClassName="text-base"
                onPress={cancelPreference}
              >
                Cancel
              </Button>
              <Button className="flex-1 py-3" textClassName="text-base" onPress={savePreference}>
                Save
              </Button>
            </View>
          </CardContent>
        </Card>
      ) : (
        <View className="mt-4 rounded-xl border-2 border-dashed border-muted px-4 py-6">
          <Text variant="body" weight="semibold" className="text-center text-sm text-muted">
            Select a category above to set your taste.
          </Text>
        </View>
      )}

      {!isHost ? (
        <Text variant="body" weight="bold" className="mt-4 text-center text-sm text-subtle">
          Waiting for the host to start…
        </Text>
      ) : null}

      <View className="mt-6">
        <BackHomeButton />
      </View>
    </Screen>
  );
}

export default function LobbyTab() {
  return (
    <SessionGate>
      {(code) => <LobbyScreenContent code={code} />}
    </SessionGate>
  );
}
