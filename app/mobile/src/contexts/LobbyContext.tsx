import { LOBBY_EVENTS, SESSION_EVENTS } from '@spinout/shared';
import { useRouter, useSegments } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { CategoryKey } from '@/components/ui/CategoryChip';
import { useSessionCode } from '@/components/SessionGate';
import type { LobbyMember, LobbySession, TagState } from '@/lib/lobby';
import { notifySessionStarted, syncSessionPushToken } from '@/lib/notifications';
import { getMembership } from '@/lib/session';
import { getSocket } from '@/lib/socket';

type LobbyContextValue = {
  code: string | null;
  session: LobbySession | null;
  members: LobbyMember[];
  myMemberId: string | null;
  readyIds: Set<string>;
  connecting: boolean;
  error: string | null;
  starting: boolean;
  isHost: boolean;
  activeCategory: CategoryKey | null;
  tagStates: Record<string, TagState>;
  savedCategories: Set<string>;
  selectCategory: (cat: CategoryKey) => void;
  cycleTag: (tag: string) => void;
  savePreference: () => void;
  cancelPreference: () => void;
  start: () => void;
};

const LobbyContext = createContext<LobbyContextValue | null>(null);

export function LobbyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const activeTabRef = useRef<string | null>(null);
  activeTabRef.current = segments[0] === '(tabs)' ? (segments[1] as string) : null;
  const { code, loading } = useSessionCode();

  const [session, setSession] = useState<LobbySession | null>(null);
  const [members, setMembers] = useState<LobbyMember[]>([]);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({});
  const [savedCategories, setSavedCategories] = useState<Set<string>>(new Set());

  const isHost = useMemo(() => {
    if (!session || !myMemberId) return false;
    const me = members.find((m) => m.id === myMemberId);
    return !!me?.userId && me.userId === session.hostId;
  }, [session, myMemberId, members]);

  useEffect(() => {
    if (loading || !code) return;

    let active = true;

    async function connect() {
      const membership = await getMembership();
      if (!active) return;

      if (!membership || membership.code !== code) {
        setError('Session membership not found.');
        setConnecting(false);
        return;
      }

      void syncSessionPushToken(code, membership.memberId).catch(() => {});

      const socket = getSocket();

      function handleJoined(payload: {
        session: LobbySession;
        members: LobbyMember[];
        memberId: string;
      }) {
        setSession(payload.session);
        setMembers(payload.members);
        setMyMemberId(payload.memberId);
        setReadyIds(
          new Set(
            payload.members
              .filter((m) => (m.preferences?.length ?? 0) > 0)
              .map((m) => m.id),
          ),
        );
        const me = payload.members.find((m) => m.id === payload.memberId);
        if (me?.preferences) {
          setSavedCategories(new Set(me.preferences.map((p) => p.category)));
        }
        setConnecting(false);
      }

      function handleMemberJoined(payload: { members: LobbyMember[] }) {
        setMembers(payload.members);
        setReadyIds((prev) => {
          const next = new Set(prev);
          payload.members
            .filter((m) => (m.preferences?.length ?? 0) > 0)
            .forEach((m) => next.add(m.id));
          return next;
        });
      }

      function handleMemberLeft(payload: { memberId: string }) {
        setMembers((prev) => prev.filter((m) => m.id !== payload.memberId));
      }

      function handlePrefUpdated(payload: { memberId: string }) {
        setReadyIds((prev) => new Set(prev).add(payload.memberId));
      }

      function handleStarted() {
        notifySessionStarted(activeTabRef.current);
        router.replace('/(tabs)/spin');
      }

      function handleError(payload: { message: string }) {
        setError(payload.message);
        setConnecting(false);
      }

      socket.on(LOBBY_EVENTS.JOINED, handleJoined);
      socket.on(LOBBY_EVENTS.MEMBER_JOINED, handleMemberJoined);
      socket.on(LOBBY_EVENTS.MEMBER_LEFT, handleMemberLeft);
      socket.on(LOBBY_EVENTS.PREF_UPDATED, handlePrefUpdated);
      socket.on(SESSION_EVENTS.STARTED, handleStarted);
      socket.on('lobby:error', handleError);

      if (!socket.connected) {
        socket.connect();
      }
      socket.emit(LOBBY_EVENTS.JOIN, { code, memberId: membership.memberId });

      return () => {
        socket.off(LOBBY_EVENTS.JOINED, handleJoined);
        socket.off(LOBBY_EVENTS.MEMBER_JOINED, handleMemberJoined);
        socket.off(LOBBY_EVENTS.MEMBER_LEFT, handleMemberLeft);
        socket.off(LOBBY_EVENTS.PREF_UPDATED, handlePrefUpdated);
        socket.off(SESSION_EVENTS.STARTED, handleStarted);
        socket.off('lobby:error', handleError);
      };
    }

    let cleanup: (() => void) | undefined;
    connect().then((fn) => {
      cleanup = fn;
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, [code, loading, router]);

  const selectCategory = useCallback(
    (cat: CategoryKey) => {
      setActiveCategory(cat);
      const me = members.find((m) => m.id === myMemberId);
      const existing = me?.preferences?.find((p) => p.category === cat);
      const next: Record<string, TagState> = {};
      existing?.likedTags.forEach((t) => {
        next[t] = 'like';
      });
      existing?.dislikedTags.forEach((t) => {
        next[t] = 'dislike';
      });
      setTagStates(next);
    },
    [members, myMemberId],
  );

  const cycleTag = useCallback((tag: string) => {
    setTagStates((prev) => {
      const next = { ...prev };
      const cur = next[tag];
      if (!cur) next[tag] = 'like';
      else if (cur === 'like') next[tag] = 'dislike';
      else delete next[tag];
      return next;
    });
  }, []);

  const savePreference = useCallback(() => {
    if (!activeCategory || !myMemberId) return;

    const likedTags = Object.entries(tagStates)
      .filter(([, v]) => v === 'like')
      .map(([t]) => t);
    const dislikedTags = Object.entries(tagStates)
      .filter(([, v]) => v === 'dislike')
      .map(([t]) => t);

    getSocket().emit(LOBBY_EVENTS.SET_PREFS, {
      memberId: myMemberId,
      category: activeCategory,
      likedTags,
      dislikedTags,
    });

    setSavedCategories((prev) => new Set(prev).add(activeCategory));
    setReadyIds((prev) => new Set(prev).add(myMemberId));
    setActiveCategory(null);
    setTagStates({});
  }, [activeCategory, myMemberId, tagStates]);

  const cancelPreference = useCallback(() => {
    setActiveCategory(null);
    setTagStates({});
  }, []);

  const start = useCallback(() => {
    if (!session) return;
    setStarting(true);
    getSocket().emit(LOBBY_EVENTS.START, {
      sessionId: session.id,
      hostId: session.hostId,
    });
  }, [session]);

  const value = useMemo<LobbyContextValue>(
    () => ({
      code,
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
    }),
    [
      code,
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
    ],
  );

  return <LobbyContext.Provider value={value}>{children}</LobbyContext.Provider>;
}

export function useLobby() {
  const ctx = useContext(LobbyContext);
  if (!ctx) {
    throw new Error('useLobby must be used within LobbyProvider');
  }
  return ctx;
}
