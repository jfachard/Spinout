import type { ActivityDto } from '@spinout/shared';
import { SESSION_EVENTS } from '@spinout/shared';
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

import { useSessionCode } from '@/components/SessionGate';
import {
  MIN_SPIN_MS,
  type GamePhase,
  type GameSession,
  type SpinHistoryEntry,
  type VoteSummary,
} from '@/lib/game';
import { fetchSession, getMembership, storeSessionHistory } from '@/lib/session';
import { notifyVoteResult, syncSessionPushToken } from '@/lib/notifications';
import { getSocket } from '@/lib/socket';

type GameContextValue = {
  code: string | null;
  session: GameSession | null;
  myMemberId: string | null;
  connecting: boolean;
  error: string | null;
  phase: GamePhase;
  spinning: boolean;
  activity: ActivityDto | null;
  spinId: string | null;
  votes: VoteSummary;
  myVote: boolean | null;
  voteResult: 'accepted' | 'rejected' | null;
  closing: boolean;
  isHost: boolean;
  memberCount: number;
  spin: () => void;
  castVote: (value: boolean) => void;
  closeSession: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const activeTabRef = useRef<string | null>(null);
  activeTabRef.current = segments[0] === '(tabs)' ? (segments[1] as string) : null;
  const { code, loading } = useSessionCode();

  const [session, setSession] = useState<GameSession | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<GamePhase>('idle');
  const [spinning, setSpinning] = useState(false);
  const [activity, setActivity] = useState<ActivityDto | null>(null);
  const [spinId, setSpinId] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteSummary>({ yes: 0, no: 0, total: 0 });
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [voteResult, setVoteResult] = useState<'accepted' | 'rejected' | null>(null);
  const [closing, setClosing] = useState(false);

  const spinStartedAt = useRef(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHost = useMemo(() => {
    if (!session || !myMemberId) return false;
    const me = session.members.find((m) => m.id === myMemberId);
    return !!me?.userId && me.userId === session.hostId;
  }, [session, myMemberId]);

  const memberCount = session?.members.length ?? 0;

  useEffect(() => {
    if (loading || !code) return;

    let active = true;

    async function connect() {
      const sessionCode = code;
      const membership = await getMembership();
      if (!active) return;

      if (!membership || membership.code !== sessionCode) {
        setError('Session membership not found.');
        setConnecting(false);
        return;
      }

      setMyMemberId(membership.memberId);
      void syncSessionPushToken(sessionCode, membership.memberId).catch(() => {});
      const socket = getSocket();

      function handleSpinStarted() {
        spinStartedAt.current = Date.now();
        if (revealTimer.current) clearTimeout(revealTimer.current);
        setActivity(null);
        setSpinId(null);
        setVotes({ yes: 0, no: 0, total: 0 });
        setMyVote(null);
        setVoteResult(null);
        setSpinning(true);
        setPhase('spinning');
      }

      function revealActivity(payload: { activity: ActivityDto; spinId: string }) {
        const elapsed = Date.now() - spinStartedAt.current;
        const delay = Math.max(0, MIN_SPIN_MS - elapsed);

        if (revealTimer.current) clearTimeout(revealTimer.current);
        revealTimer.current = setTimeout(() => {
          setActivity(payload.activity);
          setSpinId(payload.spinId);
          setVotes({ yes: 0, no: 0, total: 0 });
          setMyVote(null);
          setVoteResult(null);
          setSpinning(false);
          setPhase('voting');
        }, delay);
      }

      function handleVoteUpdate(summary: VoteSummary) {
        setVotes(summary);
      }

      function handleVoteResult(payload: {
        result: 'accepted' | 'rejected';
        activity?: ActivityDto;
        yes: number;
        no: number;
        total: number;
      }) {
        setVotes({ yes: payload.yes, no: payload.no, total: payload.total });
        setVoteResult(payload.result);
        if (payload.activity) setActivity(payload.activity);
        setPhase('result');
        notifyVoteResult(payload.result, payload.activity?.title, activeTabRef.current);
      }

      async function handleClosed(payload: { history: SpinHistoryEntry[] }) {
        await storeSessionHistory(sessionCode, payload.history);
        router.replace('/(tabs)/recap');
      }

      function handleSessionError(payload: { message: string }) {
        setError(payload.message);
        setConnecting(false);
      }

      socket.on(SESSION_EVENTS.SPIN_STARTED, handleSpinStarted);
      socket.on(SESSION_EVENTS.ACTIVITY, revealActivity);
      socket.on(SESSION_EVENTS.VOTE_UPDATE, handleVoteUpdate);
      socket.on(SESSION_EVENTS.VOTE_RESULT, handleVoteResult);
      socket.on(SESSION_EVENTS.CLOSED, handleClosed);
      socket.on('session:error', handleSessionError);

      if (!socket.connected) socket.connect();
      socket.emit(SESSION_EVENTS.JOIN, { code: sessionCode, memberId: membership.memberId });

      try {
        const data = await fetchSession(sessionCode);
        if (!active) return;
        setSession({
          id: data.id,
          code: data.code,
          hostId: data.hostId,
          status: data.status,
          members: (data.members ?? []).map((m) => ({
            id: m.id,
            userId: m.userId,
            guestName: m.guestName,
          })),
        });
        setConnecting(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Session not found');
        setConnecting(false);
      }

      return () => {
        if (revealTimer.current) clearTimeout(revealTimer.current);
        socket.off(SESSION_EVENTS.SPIN_STARTED, handleSpinStarted);
        socket.off(SESSION_EVENTS.ACTIVITY, revealActivity);
        socket.off(SESSION_EVENTS.VOTE_UPDATE, handleVoteUpdate);
        socket.off(SESSION_EVENTS.VOTE_RESULT, handleVoteResult);
        socket.off(SESSION_EVENTS.CLOSED, handleClosed);
        socket.off('session:error', handleSessionError);
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

  const spin = useCallback(() => {
    if (!session || !isHost || phase === 'spinning') return;
    spinStartedAt.current = Date.now();
    setSpinning(true);
    setPhase('spinning');
    setActivity(null);
    setSpinId(null);
    setVoteResult(null);
    setMyVote(null);
    getSocket().emit(SESSION_EVENTS.SPIN, {
      sessionId: session.id,
      hostId: session.hostId,
    });
  }, [session, isHost, phase]);

  const castVote = useCallback(
    (value: boolean) => {
      if (!session || !spinId || !myMemberId || myVote !== null) return;
      setMyVote(value);
      getSocket().emit(SESSION_EVENTS.VOTE, {
        spinId,
        memberId: myMemberId,
        value,
        sessionId: session.id,
      });
    },
    [session, spinId, myMemberId, myVote],
  );

  const closeSession = useCallback(() => {
    if (!session || !isHost) return;
    setClosing(true);
    getSocket().emit(SESSION_EVENTS.CLOSE, {
      sessionId: session.id,
      hostId: session.hostId,
    });
  }, [session, isHost]);

  const value = useMemo<GameContextValue>(
    () => ({
      code,
      session,
      myMemberId,
      connecting,
      error,
      phase,
      spinning,
      activity,
      spinId,
      votes,
      myVote,
      voteResult,
      closing,
      isHost,
      memberCount,
      spin,
      castVote,
      closeSession,
    }),
    [
      code,
      session,
      myMemberId,
      connecting,
      error,
      phase,
      spinning,
      activity,
      spinId,
      votes,
      myVote,
      voteResult,
      closing,
      isHost,
      memberCount,
      spin,
      castVote,
      closeSession,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider');
  }
  return ctx;
}
