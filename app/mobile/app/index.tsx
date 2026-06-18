import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Camera, Sun } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { HeroWheel } from '@/components/HeroWheel';
import { Screen } from '@/components/Screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchMe,
  getGuestDisplayName,
  getStoredUsername,
  storeGuestDisplayName,
  storeUsername,
} from '@/lib/auth';
import {
  createErrorMessage,
  joinErrorMessage,
  parseJoinCode,
  SESSION_CODE_RE,
} from '@/lib/join';
import { syncSessionPushToken } from '@/lib/notifications';
import {
  createSession,
  getMembership,
  joinSession,
  storeMembership,
} from '@/lib/session';

export default function HomeScreen() {
  const router = useRouter();
  const { join: joinParam } = useLocalSearchParams<{ join?: string }>();
  const { isAuthenticated } = useAuth();

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [lastCode, setLastCode] = useState<string | null>(null);

  const loadJoinDisplayName = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const me = await fetchMe();
        await storeUsername(me.username);
        setJoinDisplayName(me.username);
        return;
      } catch {
        const cached = await getStoredUsername();
        if (cached) setJoinDisplayName(cached);
        return;
      }
    }
    const guest = await getGuestDisplayName();
    if (guest) setJoinDisplayName(guest);
  }, [isAuthenticated]);

  const openJoinWithCode = useCallback((code: string) => {
    setJoinCode(code);
    setJoinOpen(true);
    setJoinError(null);
    void loadJoinDisplayName();
  }, [loadJoinDisplayName]);

  useEffect(() => {
    getMembership().then((m) => setLastCode(m?.code ?? null));
  }, []);

  useEffect(() => {
    if (typeof joinParam === 'string') {
      const code = parseJoinCode(joinParam);
      if (code) openJoinWithCode(code);
    }
  }, [joinParam, openJoinWithCode]);

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      const join = parsed.queryParams?.join;
      if (typeof join === 'string') {
        const code = parseJoinCode(join);
        if (code) openJoinWithCode(code);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, [openJoinWithCode]);

  async function handleCreate() {
    setCreateError(null);
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setCreating(true);
    try {
      const session = await createSession([]);
      const hostMember = session.members?.[0];
      if (hostMember) {
        await storeMembership({ code: session.code, memberId: hostMember.id });
        await syncSessionPushToken(session.code, hostMember.id);
      }
      router.replace('/(tabs)/lobby');
    } catch (err) {
      setCreateError(createErrorMessage(err));
      setCreating(false);
    }
  }

  async function handleJoin() {
    setJoinError(null);

    const normalized = joinCode.trim().toUpperCase();
    if (!SESSION_CODE_RE.test(normalized)) {
      setJoinError('Code must be 6 characters (letters/numbers).');
      return;
    }
    const displayName = joinDisplayName.trim();
    if (!isAuthenticated && displayName.length === 0) {
      setJoinError('Enter a name to join as guest.');
      return;
    }

    setJoining(true);
    try {
      if (!isAuthenticated) {
        await storeGuestDisplayName(displayName);
      }
      const { session, member } = await joinSession(
        normalized,
        isAuthenticated ? undefined : displayName,
      );
      await storeMembership({
        code: session.code,
        memberId: member.id,
        guestName: member.guestName ?? undefined,
      });
      await syncSessionPushToken(session.code, member.id);
      router.replace('/(tabs)/lobby');
    } catch (err) {
      setJoinError(joinErrorMessage(err));
      setJoining(false);
    }
  }

  return (
    <Screen scroll contentClassName="pb-4">
      <BrandLogo className="mt-1.5" />

      <View className="mt-6">
        <Badge>
          <Sun size={14} color="#3A2A24" strokeWidth={2.5} />
          <Text variant="body" weight="extrabold" className="text-xs text-ink">
            tonight&apos;s plan, sorted
          </Text>
        </Badge>

        <Text
          variant="display"
          weight="extrabold"
          className="mt-4 text-[40px] leading-[48px] text-ink"
        >
          Let the wheel{'\n'}decide.
        </Text>
        <Text variant="body" weight="semibold" className="mt-3 text-[15px] leading-6 text-subtle">
          Round up the crew, give it a spin, and just go. Voting included.
        </Text>
      </View>

      <View className="my-8 items-center">
        <HeroWheel />
      </View>

      <View className="gap-3">
        <Button loading={creating} onPress={handleCreate} className="w-full">
          {creating ? 'Creating…' : 'Create a session'}
        </Button>

        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1 px-4"
            textClassName="text-base"
            onPress={() => {
              setJoinOpen((v) => {
                const next = !v;
                if (next) void loadJoinDisplayName();
                return next;
              });
            }}
          >
            Enter code
          </Button>
          <Button
            variant="dark"
            className="flex-1 px-4"
            textClassName="text-base"
            icon={<Camera size={18} color="#fff" strokeWidth={2.5} />}
            onPress={() => router.push('/join/scan')}
          >
            Scan
          </Button>
        </View>

        {joinOpen ? (
          <View className="gap-3 pt-1">
            <View className="flex-row items-center gap-3 rounded-2xl border-[2.5px] border-dashed border-[#C9B6A1] bg-surface px-4 py-3">
              <Input
                value={joinCode}
                onChangeText={(v) => setJoinCode(v.toUpperCase())}
                placeholder="SUNSET"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                containerClassName="flex-1 gap-0"
                className="border-0 bg-transparent px-0 py-0 font-display text-lg tracking-widest"
              />
              <Pressable
                onPress={handleJoin}
                disabled={joining}
                className="rounded-xl border-[2.5px] border-ink bg-ink px-4 py-2 opacity-100 disabled:opacity-50"
              >
                <Text variant="display" weight="bold" className="text-sm text-paper">
                  {joining ? '…' : 'Go →'}
                </Text>
              </Pressable>
            </View>

            <Input
              label={isAuthenticated ? 'Your name' : 'Your name (guest)'}
              value={joinDisplayName}
              onChangeText={setJoinDisplayName}
              editable={!isAuthenticated}
              maxLength={20}
              placeholder="Alex"
              autoCapitalize="words"
              className={isAuthenticated ? 'text-subtle' : undefined}
            />
            {isAuthenticated ? (
              <Text variant="body" weight="semibold" className="-mt-1 text-xs text-muted">
                From your account — shown to the group in the lobby.
              </Text>
            ) : null}

            {joinError ? (
              <Text variant="body" weight="bold" className="text-sm text-primary">
                {joinError}
              </Text>
            ) : null}
          </View>
        ) : null}

        {createError ? (
          <Text variant="body" weight="bold" className="text-sm text-primary">
            {createError}
          </Text>
        ) : null}

        {lastCode ? (
          <Link href="/(tabs)/recap" asChild>
            <Pressable className="py-1">
              <Text variant="body" weight="bold" className="text-center text-sm text-muted">
                View last session recap ({lastCode})
              </Text>
            </Pressable>
          </Link>
        ) : null}

        {!isAuthenticated ? (
          <View className="flex-row flex-wrap justify-center gap-1 py-1">
            <Text variant="body" weight="semibold" className="text-subtle">
              Have an account?
            </Text>
            <Link href="/auth/login" asChild>
              <Pressable>
                <Text variant="body" weight="bold" className="text-primary">
                  Log in
                </Text>
              </Pressable>
            </Link>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
