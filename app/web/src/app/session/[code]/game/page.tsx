"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import type { ActivityDto } from "@spinout/shared";
import { SESSION_EVENTS } from "@spinout/shared";
import { Navbar } from "@/components/Navbar";
import { Wheel } from "@/components/Wheel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CATEGORY_META,
  CategoryChip,
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
  const [voteResult, setVoteResult] = useState<"accepted" | "rejected" | null>(
    null,
  );
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

    function revealActivity(payload: {
      activity: ActivityDto;
      spinId: string;
    }) {
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

    socket.on(SESSION_EVENTS.ACTIVITY, revealActivity);
    socket.on(SESSION_EVENTS.VOTE_UPDATE, handleVoteUpdate);
    socket.on(SESSION_EVENTS.VOTE_RESULT, handleVoteResult);
    socket.on(SESSION_EVENTS.CLOSED, handleClosed);
    socket.on("session:error", handleSessionError);

    if (!socket.connected) socket.connect();
    socket.emit(SESSION_EVENTS.JOIN, {
      code,
      memberId: membership.memberId,
    });

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
          <h1 className="text-3xl font-display font-extrabold text-ink mb-3">
            Oops
          </h1>
          <p className="font-body text-subtle mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Back home</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-7 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-2 self-start bg-primary/15 border-[2.5px] border-ink rounded-full px-3 py-1 font-body font-bold text-xs text-ink">
              {connecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
              {connecting ? "Connecting…" : "Game on"}
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
              {closing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "End session"
              )}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
          {/* Wheel */}
          <div className="flex flex-col items-center gap-6">
            <Wheel
              size={240}
              spinning={spinning}
              durationMs={MIN_SPIN_MS}
              className={cn("sm:hidden", phase === "result" && voteResult === "accepted" && "animate-floaty")}
            />
            <Wheel
              size={320}
              spinning={spinning}
              durationMs={MIN_SPIN_MS}
              className={cn("hidden sm:block", phase === "result" && voteResult === "accepted" && "animate-floaty")}
            />

            {isHost && phase !== "spinning" && phase !== "voting" && (
              <Button
                onClick={spin}
                disabled={connecting || (phase === "result" && voteResult === "accepted")}
                className="min-w-[180px]"
              >
                {voteResult === "rejected" ? (
                  <>
                    <RotateCcw size={20} strokeWidth={2.5} />
                    Spin again
                  </>
                ) : (
                  "Spin"
                )}
              </Button>
            )}

            {!isHost && phase === "idle" && (
              <p className="font-body text-subtle text-center">
                Waiting for the host to spin…
              </p>
            )}
          </div>

          {/* Activity + votes */}
          <div className="flex flex-col gap-6">
            {voteResult && (
              <div
                className={cn(
                  "rounded-xl border-[2.5px] border-ink px-5 py-4 shadow-sticker animate-pop-in",
                  voteResult === "accepted"
                    ? "bg-[#7A9A52] text-white"
                    : "bg-[#C44B4B] text-white",
                )}
              >
                <div className="flex items-center gap-3">
                  {voteResult === "accepted" ? (
                    <CheckCircle2 size={28} strokeWidth={2.5} />
                  ) : (
                    <XCircle size={28} strokeWidth={2.5} />
                  )}
                  <div>
                    <p className="font-display font-extrabold text-xl">
                      {voteResult === "accepted" ? "Accepted!" : "Rejected"}
                    </p>
                    <p className="font-body text-sm opacity-90">
                      {votes.yes} yes · {votes.no} no · {votes.total}/{memberCount} voted
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activity && phase !== "idle" && phase !== "spinning" && (
              <Card className="animate-pop-in">
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {isCategoryKey(activity.category) ? (
                      <CategoryChip category={activity.category} selected />
                    ) : (
                      <span className="font-body font-bold text-sm text-subtle capitalize">
                        {activity.category}
                      </span>
                    )}
                    <span className="font-body text-sm text-muted">
                      {activity.minPlayers}–{activity.maxPlayers} players
                    </span>
                  </div>

                  <h2 className="font-display font-extrabold text-3xl text-ink">
                    {activity.title}
                  </h2>

                  {activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activity.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-body text-xs font-bold px-2.5 py-1 rounded-full bg-paper border-2 border-ink"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {(phase === "voting" || (phase === "result" && !voteResult)) && activity && (
              <Card>
                <CardContent className="flex flex-col gap-5">
                  <h3 className="font-display font-bold text-xl text-ink">
                    Vote
                  </h3>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-[#7A9A52] hover:opacity-90"
                      onClick={() => castVote(true)}
                      disabled={myVote !== null}
                    >
                      <ThumbsUp size={20} strokeWidth={2.5} />
                      Yes
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => castVote(false)}
                      disabled={myVote !== null}
                    >
                      <ThumbsDown size={20} strokeWidth={2.5} />
                      No
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between font-body text-sm font-bold text-subtle">
                      <span>{votes.yes} yes</span>
                      <span>{votes.no} no</span>
                      <span>
                        {votes.total}/{memberCount}
                      </span>
                    </div>
                    <div className="h-3 rounded-full border-2 border-ink overflow-hidden flex bg-paper">
                      <div
                        className="bg-[#7A9A52] transition-all duration-300"
                        style={{
                          width: memberCount
                            ? `${(votes.yes / memberCount) * 100}%`
                            : "0%",
                        }}
                      />
                      <div
                        className="bg-[#C44B4B] transition-all duration-300"
                        style={{
                          width: memberCount
                            ? `${(votes.no / memberCount) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {myVote !== null && (
                    <p className="font-body text-sm text-muted text-center">
                      You voted {myVote ? "yes" : "no"} — waiting for others…
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {phase === "spinning" && (
              <Card>
                <CardContent className="py-10 text-center">
                  <Loader2
                    size={32}
                    className="animate-spin mx-auto mb-3 text-primary"
                  />
                  <p className="font-display font-bold text-xl text-ink">
                    Picking an activity…
                  </p>
                </CardContent>
              </Card>
            )}

            {phase === "idle" && !activity && (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="font-body text-subtle">
                    {isHost
                      ? "Hit Spin when everyone is ready."
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
