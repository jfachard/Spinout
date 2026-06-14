"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Disc3,
  Dumbbell,
  Flower2,
  House,
  Loader2,
  type LucideIcon,
  Palette,
  PartyPopper,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  TreePine,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { ActivityDto } from "@/lib/events";
import { SESSION_EVENTS } from "@/lib/events";
import { Navbar } from "@/components/Navbar";
import { Wheel } from "@/components/Wheel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CATEGORY_META,
  type CategoryKey,
} from "@/components/ui/CategoryChip";
import { getSocket } from "@/lib/socket";
import { fetchSession, getMembership } from "@/lib/session";
import { cn } from "@/lib/utils";

const MIN_SPIN_MS = 4000;
const HISTORY_KEY = (code: string) => `spinout.history.${code}`;

type Phase = "idle" | "spinning" | "voting" | "result";

interface VoteSummary {
  yes: number;
  no: number;
  total: number;
}

interface GameSession {
  id: string;
  code: string;
  hostId: string;
  status: string;
  members: { id: string; userId: string | null; guestName: string | null }[];
}

const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  indoor:     House,
  outdoor:    TreePine,
  sport:      Dumbbell,
  relaxation: Flower2,
  party:      PartyPopper,
  culture:    Palette,
  food:       UtensilsCrossed,
};

function isCategoryKey(value: string): value is CategoryKey {
  return value in CATEGORY_META;
}

export default function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const spinStartedAt = useRef(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [session, setSession] = useState<GameSession | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [spinning, setSpinning] = useState(false);
  const [activity, setActivity] = useState<ActivityDto | null>(null);
  const [spinId, setSpinId] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteSummary>({ yes: 0, no: 0, total: 0 });
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [voteResult, setVoteResult] = useState<"accepted" | "rejected" | null>(null);
  const [closing, setClosing] = useState(false);

  const isHost = useMemo(() => {
    if (!session || !myMemberId) return false;
    const me = session.members.find((m) => m.id === myMemberId);
    return !!me?.userId && me.userId === session.hostId;
  }, [session, myMemberId]);

  const memberCount = session?.members.length ?? 0;

  useEffect(() => {
    const membership = getMembership();
    if (!membership || membership.code !== code) {
      router.replace(`/?join=${code}`);
      return;
    }

    setMyMemberId(membership.memberId);

    let cancelled = false;
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
      setPhase("spinning");
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
        setPhase("voting");
      }, delay);
    }

    function handleVoteUpdate(summary: VoteSummary) {
      setVotes(summary);
    }

    function handleVoteResult(payload: {
      result: "accepted" | "rejected";
      activity?: ActivityDto;
      yes: number;
      no: number;
      total: number;
    }) {
      setVotes({ yes: payload.yes, no: payload.no, total: payload.total });
      setVoteResult(payload.result);
      if (payload.activity) setActivity(payload.activity);
      setPhase("result");
    }

    function handleClosed(payload: {
      history: {
        id: string;
        spinNumber: number;
        result: string;
        activity: ActivityDto;
        votes: { value: boolean }[];
      }[];
    }) {
      sessionStorage.setItem(HISTORY_KEY(code), JSON.stringify(payload.history));
      router.push(`/session/${code}/history`);
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
    socket.on("session:error", handleSessionError);

    if (!socket.connected) socket.connect();
    socket.emit(SESSION_EVENTS.JOIN, { code, memberId: membership.memberId });

    fetchSession(code)
      .then((data) => {
        if (cancelled) return;
        setSession({
          id: data.id,
          code: data.code,
          hostId: data.hostId,
          status: data.status,
          members: data.members ?? [],
        });
        setConnecting(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Session not found");
        setConnecting(false);
      });

    return () => {
      cancelled = true;
      if (revealTimer.current) clearTimeout(revealTimer.current);
      socket.off(SESSION_EVENTS.SPIN_STARTED, handleSpinStarted);
      socket.off(SESSION_EVENTS.ACTIVITY, revealActivity);
      socket.off(SESSION_EVENTS.VOTE_UPDATE, handleVoteUpdate);
      socket.off(SESSION_EVENTS.VOTE_RESULT, handleVoteResult);
      socket.off(SESSION_EVENTS.CLOSED, handleClosed);
      socket.off("session:error", handleSessionError);
    };
  }, [code, router]);

  function spin() {
    if (!session || !isHost || phase === "spinning") return;
    spinStartedAt.current = Date.now();
    setSpinning(true);
    setPhase("spinning");
    setActivity(null);
    setSpinId(null);
    setVoteResult(null);
    setMyVote(null);
    getSocket().emit(SESSION_EVENTS.SPIN, {
      sessionId: session.id,
      hostId: session.hostId,
    });
  }

  function castVote(value: boolean) {
    if (!session || !spinId || !myMemberId || myVote !== null) return;
    setMyVote(value);
    getSocket().emit(SESSION_EVENTS.VOTE, {
      spinId,
      memberId: myMemberId,
      value,
      sessionId: session.id,
    });
  }

  function closeSession() {
    if (!session || !isHost) return;
    setClosing(true);
    getSocket().emit(SESSION_EVENTS.CLOSE, {
      sessionId: session.id,
      hostId: session.hostId,
    });
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-[640px] mx-auto px-7 py-20 text-center">
          <h1 className="text-3xl font-display font-extrabold text-ink mb-3">Oops</h1>
          <p className="font-body text-subtle mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Back home</Button>
        </main>
      </div>
    );
  }

  const catMeta =
    activity && isCategoryKey(activity.category)
      ? CATEGORY_META[activity.category]
      : null;
  const CatIcon =
    activity && isCategoryKey(activity.category)
      ? CATEGORY_ICON[activity.category]
      : null;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-7 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <span className="font-body font-extrabold text-xs tracking-[0.12em] uppercase text-muted">
              {connecting ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Connecting…
                </span>
              ) : (
                "Game on"
              )}
            </span>
            <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-ink">
              Spin!
            </h1>
          </div>

          {isHost && (
            <Button
              variant="secondary"
              className="text-base px-4 py-2"
              onClick={closeSession}
              disabled={closing || connecting}
            >
              {closing ? <Loader2 size={18} className="animate-spin" /> : "End session"}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
          {/* Wheel column */}
          <div className="flex flex-col items-center gap-6">
            <Wheel
              size={240}
              spinning={spinning}
              durationMs={MIN_SPIN_MS}
              className={cn(
                "sm:hidden",
                phase === "result" && voteResult === "accepted" && "animate-floaty",
              )}
            />
            <Wheel
              size={320}
              spinning={spinning}
              durationMs={MIN_SPIN_MS}
              className={cn(
                "hidden sm:block",
                phase === "result" && voteResult === "accepted" && "animate-floaty",
              )}
            />

            {isHost && phase !== "spinning" && phase !== "voting" && (
              <button
                type="button"
                onClick={spin}
                disabled={
                  connecting ||
                  (phase === "result" && voteResult === "accepted")
                }
                className="font-display font-extrabold text-2xl text-ink bg-amber border-[3px] border-ink rounded-[18px] px-12 py-4 shadow-sticker-lg cursor-pointer select-none transition-[transform,box-shadow] duration-75 active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none"
              >
                {voteResult === "rejected" ? (
                  <span className="flex items-center gap-2">
                    <RotateCcw size={22} strokeWidth={2.5} />
                    Spin again
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Disc3 size={24} strokeWidth={2.5} />
                    SPIN
                  </span>
                )}
              </button>
            )}

            {!isHost && phase === "idle" && (
              <p className="font-body text-subtle text-center">
                Waiting for the host to spin…
              </p>
            )}
          </div>

          {/* Activity + votes column */}
          <div className="flex flex-col gap-5">
            {/* Spinning state */}
            {phase === "spinning" && (
              <Card>
                <CardContent className="py-10 text-center">
                  <Loader2 size={32} className="animate-spin mx-auto mb-3 text-primary" />
                  <p className="font-display font-bold text-xl text-ink">
                    Round and round… 🌀
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Activity reveal card */}
            {activity && phase !== "idle" && phase !== "spinning" && (
              <div
                className="w-full rounded-[22px] border-[3px] border-ink p-7 text-center text-white animate-pop-in"
                style={{
                  background: catMeta?.color ?? "#E8643C",
                  boxShadow: "6px 6px 0 #3a2a24",
                }}
              >
                <span className="inline-block font-body font-extrabold text-xs tracking-[0.1em] uppercase bg-surface text-ink border-2 border-ink rounded-full px-3 py-1">
                  {catMeta?.label ?? activity.category}
                </span>
                <div className="my-4 flex justify-center">
                  {CatIcon ? (
                    <CatIcon size={52} strokeWidth={2} color="#FFFCF6" />
                  ) : (
                    <span className="text-5xl leading-none">🎲</span>
                  )}
                </div>
                <h2 className="font-display font-extrabold text-3xl leading-tight">
                  {activity.title}
                </h2>
                {activity.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                    {activity.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-body text-xs font-bold px-2.5 py-1 rounded-full bg-white/25"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vote buttons */}
            {phase === "voting" && activity && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => castVote(false)}
                  disabled={myVote !== null}
                  className="flex-1 inline-flex items-center justify-center gap-2 font-display font-extrabold text-xl text-ink bg-surface border-[3px] border-ink rounded-2xl py-4 shadow-sticker cursor-pointer select-none transition-[transform,box-shadow] duration-75 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ThumbsDown size={20} strokeWidth={2.5} />
                  Nope
                </button>
                <button
                  type="button"
                  onClick={() => castVote(true)}
                  disabled={myVote !== null}
                  className="flex-1 inline-flex items-center justify-center gap-2 font-display font-extrabold text-xl text-white border-[3px] border-ink rounded-2xl py-4 shadow-sticker cursor-pointer select-none transition-[transform,box-shadow] duration-75 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none"
                  style={{ background: "#7A9A52" }}
                >
                  <ThumbsUp size={20} strokeWidth={2.5} />
                  Yes!
                </button>
              </div>
            )}

            {/* Live vote counter */}
            {phase === "voting" && myVote !== null && (
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-lg text-ink">
                      {votes.total}/{memberCount} voted
                    </span>
                    <div className="flex gap-2">
                      <span
                        className="font-body font-extrabold text-sm text-white border-2 border-ink rounded-full px-3 py-1 inline-flex items-center gap-1.5"
                        style={{ background: "#7A9A52" }}
                      >
                        <ThumbsUp size={13} strokeWidth={2.5} /> {votes.yes}
                      </span>
                      <span className="font-body font-extrabold text-sm text-ink bg-paper border-2 border-ink rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                        <ThumbsDown size={13} strokeWidth={2.5} /> {votes.no}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full border-2 border-ink overflow-hidden flex bg-paper">
                    <div
                      className="transition-all duration-300"
                      style={{
                        background: "#7A9A52",
                        width: memberCount ? `${(votes.yes / memberCount) * 100}%` : "0%",
                      }}
                    />
                    <div
                      className="transition-all duration-300"
                      style={{
                        background: "#C9533A",
                        width: memberCount ? `${(votes.no / memberCount) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <p className="font-body text-sm text-muted text-center">
                    You voted {myVote ? "yes" : "no"} — waiting for others…
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Accepted result */}
            {voteResult === "accepted" && (
              <div
                className="w-full rounded-[18px] border-[3px] border-ink p-6 text-center text-white animate-pop-in"
                style={{ background: "#7A9A52", boxShadow: "5px 5px 0 #3a2a24" }}
              >
                <p className="font-display font-extrabold text-3xl inline-flex items-center gap-3">
                  <Check size={28} strokeWidth={3} /> It&apos;s a yes!
                </p>
                <p className="font-body font-bold text-base opacity-95 mt-1 mb-5">
                  {votes.yes} of {memberCount} are in. Grab your stuff — let&apos;s gooo.
                </p>
                <div className="flex gap-3 justify-center">
                  {isHost && (
                    <Button
                      variant="secondary"
                      onClick={spin}
                      disabled={connecting}
                    >
                      Spin again
                    </Button>
                  )}
                  <Button
                    onClick={closeSession}
                    disabled={closing}
                    className="bg-ink text-paper border-ink"
                  >
                    {closing ? <Loader2 size={18} className="animate-spin" /> : "See recap →"}
                  </Button>
                </div>
              </div>
            )}

            {/* Rejected result */}
            {voteResult === "rejected" && (
              <div
                className="w-full bg-surface rounded-[18px] border-[3px] border-dashed border-[#C9836A] p-6 text-center animate-shake-x"
                style={{ boxShadow: "5px 5px 0 #DCC9B6" }}
              >
                <p className="font-display font-extrabold text-2xl text-[#C9533A] inline-flex items-center gap-2">
                  <X size={22} strokeWidth={3} /> Not it
                </p>
                <p className="font-body font-bold text-base text-subtle mt-1 mb-5">
                  Only {votes.yes} of {memberCount} said yes. Give the wheel another whirl.
                </p>
                {isHost && (
                  <Button onClick={spin} disabled={connecting} className="inline-flex items-center gap-2">
                    <RotateCcw size={16} strokeWidth={2.5} />
                    Spin again
                  </Button>
                )}
              </div>
            )}

            {/* Idle placeholder */}
            {phase === "idle" && !activity && (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="font-body text-subtle">
                    {isHost
                      ? "Hit SPIN when everyone is ready."
                      : "The wheel will spin when the host starts."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
