"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  Rocket,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { LOBBY_EVENTS, SESSION_EVENTS } from "@spinout/shared";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CATEGORY_META,
  CategoryChip,
  type CategoryKey,
} from "@/components/ui/CategoryChip";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { getMembership } from "@/lib/session";
import { cn } from "@/lib/utils";

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as CategoryKey[];

const CATEGORY_TAGS: Record<CategoryKey, string[]> = {
  indoor: ["games", "competitive", "chill", "movies", "cooking", "creative", "music", "puzzles"],
  outdoor: ["nature", "active", "adventure", "walking", "chill", "views", "social", "food"],
  sport: ["competitive", "active", "team", "fun"],
  relaxation: ["wellness", "chill", "self-care", "quiet", "movies", "intellectual", "lazy"],
  party: ["social", "music", "drinks", "dancing", "games", "creative", "views", "fun"],
  culture: ["intellectual", "art", "quiet", "music", "social", "walking", "movies", "shopping"],
  food: ["food", "social", "adventure", "cooking", "chill", "outdoor", "fancy", "creative"],
};

type TagState = "like" | "dislike";

interface LobbyPreference {
  category: string;
  likedTags: string[];
  dislikedTags: string[];
}

interface LobbyMember {
  id: string;
  userId: string | null;
  guestName: string | null;
  user?: { username: string } | null;
  preferences?: LobbyPreference[];
}

interface LobbySession {
  id: string;
  code: string;
  hostId: string;
  status: string;
  categories: string[];
}

function memberName(m: LobbyMember): string {
  return m.user?.username ?? m.guestName ?? "Guest";
}

export default function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<LobbySession | null>(null);
  const [members, setMembers] = useState<LobbyMember[]>([]);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Preference editor
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({});
  const [savedCategories, setSavedCategories] = useState<Set<string>>(new Set());

  const isHost = useMemo(() => {
    if (!session || !myMemberId) return false;
    const me = members.find((m) => m.id === myMemberId);
    return !!me?.userId && me.userId === session.hostId;
  }, [session, myMemberId, members]);

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/?join=${code}`;

  useEffect(() => {
    const membership = getMembership();
    if (!membership || membership.code !== code) {
      router.replace(`/?join=${code}`);
      return;
    }

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
      router.push(`/session/${code}/game`);
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
    socket.on("lobby:error", handleError);

    socket.connect();
    socket.emit(LOBBY_EVENTS.JOIN, { code, memberId: membership.memberId });

    return () => {
      socket.off(LOBBY_EVENTS.JOINED, handleJoined);
      socket.off(LOBBY_EVENTS.MEMBER_JOINED, handleMemberJoined);
      socket.off(LOBBY_EVENTS.MEMBER_LEFT, handleMemberLeft);
      socket.off(LOBBY_EVENTS.PREF_UPDATED, handlePrefUpdated);
      socket.off(SESSION_EVENTS.STARTED, handleStarted);
      socket.off("lobby:error", handleError);
      disconnectSocket();
    };
  }, [code, router]);

  function selectCategory(cat: CategoryKey) {
    setActiveCategory(cat);
    const me = members.find((m) => m.id === myMemberId);
    const existing = me?.preferences?.find((p) => p.category === cat);
    const next: Record<string, TagState> = {};
    existing?.likedTags.forEach((t) => (next[t] = "like"));
    existing?.dislikedTags.forEach((t) => (next[t] = "dislike"));
    setTagStates(next);
  }

  function cycleTag(tag: string) {
    setTagStates((prev) => {
      const next = { ...prev };
      const cur = next[tag];
      if (!cur) next[tag] = "like";
      else if (cur === "like") next[tag] = "dislike";
      else delete next[tag];
      return next;
    });
  }

  function savePreference() {
    if (!activeCategory || !myMemberId) return;
    const likedTags = Object.entries(tagStates)
      .filter(([, v]) => v === "like")
      .map(([t]) => t);
    const dislikedTags = Object.entries(tagStates)
      .filter(([, v]) => v === "dislike")
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
  }

  function start() {
    if (!session) return;
    setStarting(true);
    getSocket().emit(LOBBY_EVENTS.START, {
      sessionId: session.id,
      hostId: session.hostId,
    });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
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

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-7 py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-2 self-start bg-amber/20 border-[2.5px] border-ink rounded-full px-3 py-1 font-body font-bold text-xs text-ink">
              {connecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#7A9A52]" />
              )}
              {connecting ? "Connecting…" : "Waiting for players"}
            </span>
            <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-ink">
              Lobby
            </h1>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className="group inline-flex items-center gap-3 bg-surface border-[2.5px] border-ink rounded-xl shadow-sticker px-5 py-3 cursor-pointer active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow] duration-75"
            title="Copy code"
          >
            <span className="font-display font-extrabold text-2xl tracking-[0.2em] text-ink">
              {code}
            </span>
            {copied ? (
              <Check size={20} className="text-[#7A9A52]" strokeWidth={2.5} />
            ) : (
              <Copy size={20} className="text-subtle" strokeWidth={2.5} />
            )}
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-7 items-start">
          {/* Left: members + QR */}
          <div className="flex flex-col gap-7">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-ink">
                  <Users size={20} strokeWidth={2.5} />
                  <h2 className="font-display font-bold text-xl">
                    Players ({members.length})
                  </h2>
                </div>

                <ul className="flex flex-col gap-2">
                  {members.map((m) => {
                    const host = !!m.userId && m.userId === session?.hostId;
                    const ready = readyIds.has(m.id);
                    return (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-3 bg-paper border-[2px] border-ink rounded-lg px-3 py-2"
                      >
                        <span className="flex items-center gap-2 font-body font-bold text-ink">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber/30 border-[2px] border-ink font-display text-sm">
                            {memberName(m).charAt(0).toUpperCase()}
                          </span>
                          {memberName(m)}
                          {m.id === myMemberId && (
                            <span className="text-xs text-muted">(you)</span>
                          )}
                          {host && (
                            <Crown
                              size={16}
                              className="text-amber"
                              strokeWidth={2.5}
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            "font-body font-bold text-xs px-2 py-0.5 rounded-full border-[2px] border-ink",
                            ready
                              ? "bg-[#7A9A52] text-white"
                              : "bg-surface text-muted",
                          )}
                        >
                          {ready ? "Ready" : "Picking…"}
                        </span>
                      </li>
                    );
                  })}
                  {members.length === 0 && (
                    <li className="font-body text-sm text-muted py-2">
                      No one here yet.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <h2 className="font-display font-bold text-xl text-ink self-start">
                  Invite friends
                </h2>
                <div className="bg-white border-[2.5px] border-ink rounded-xl p-3 shadow-sticker-sm">
                  <QRCodeSVG value={joinUrl} size={150} fgColor="#3a2a24" />
                </div>
                <p className="font-body text-sm text-subtle">
                  Scan to join with code{" "}
                  <span className="font-bold text-ink">{code}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: preferences */}
          <Card>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 className="font-display font-bold text-xl text-ink">
                  Your preferences
                </h2>
                <p className="font-body text-sm text-subtle">
                  Pick a category, then thumb tags up or down. Tap a tag to
                  cycle 👍 → 👎 → off.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORY_KEYS.map((cat) => (
                  <span key={cat} className="relative">
                    <CategoryChip
                      category={cat}
                      selected={activeCategory === cat}
                      onClick={() => selectCategory(cat)}
                    />
                    {savedCategories.has(cat) && activeCategory !== cat && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-[#7A9A52] border-[1.5px] border-ink">
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                ))}
              </div>

              {activeCategory ? (
                <div className="flex flex-col gap-4 bg-paper border-[2px] border-ink rounded-xl p-4">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_TAGS[activeCategory].map((tag) => {
                      const state = tagStates[tag];
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => cycleTag(tag)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body font-bold text-sm border-[2px] border-ink shadow-sticker-sm cursor-pointer select-none transition-[transform,box-shadow] duration-75 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                            state === "like" && "bg-[#7A9A52] text-white",
                            state === "dislike" && "bg-primary text-white",
                            !state && "bg-surface text-ink",
                          )}
                        >
                          {state === "like" && (
                            <ThumbsUp size={14} strokeWidth={2.5} />
                          )}
                          {state === "dislike" && (
                            <ThumbsDown size={14} strokeWidth={2.5} />
                          )}
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="text-base px-4 py-2"
                      onClick={() => {
                        setActiveCategory(null);
                        setTagStates({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="text-base px-4 py-2"
                      onClick={savePreference}
                    >
                      Save preference
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="font-body text-sm text-muted bg-paper border-[2px] border-dashed border-muted rounded-xl px-4 py-6 text-center">
                  Select a category above to set your taste.
                </p>
              )}

              <div className="border-t-[2.5px] border-ink/10 pt-5 mt-1">
                {isHost ? (
                  <Button
                    onClick={start}
                    disabled={starting || members.length < 1}
                    className="w-full"
                  >
                    {starting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Rocket size={20} strokeWidth={2.5} />
                    )}
                    {starting ? "Starting…" : "Start the spin"}
                  </Button>
                ) : (
                  <p className="font-body font-bold text-center text-subtle">
                    Waiting for the host to start…
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
