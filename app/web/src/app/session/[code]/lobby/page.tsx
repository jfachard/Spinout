"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  Copy,
  Disc3,
  Dumbbell,
  Flower2,
  House,
  Link2,
  Loader2,
  type LucideIcon,
  Palette,
  PartyPopper,
  Share2,
  ThumbsDown,
  ThumbsUp,
  TreePine,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { LOBBY_EVENTS, SESSION_EVENTS } from "@/lib/events";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CATEGORY_META,
  type CategoryKey,
} from "@/components/ui/CategoryChip";
import { getSocket } from "@/lib/socket";
import { getMembership } from "@/lib/session";
import { cn } from "@/lib/utils";

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as CategoryKey[];

const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  indoor:     House,
  outdoor:    TreePine,
  sport:      Dumbbell,
  relaxation: Flower2,
  party:      PartyPopper,
  culture:    Palette,
  food:       UtensilsCrossed,
};

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

const MEMBER_COLORS = [
  "#E8643C", "#F2A03D", "#7A9A52", "#6F94A8", "#D1688A", "#9B72CF", "#C98A3A",
];

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
  const [linkCopied, setLinkCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({});
  const [savedCategories, setSavedCategories] = useState<Set<string>>(new Set());

  const isHost = useMemo(() => {
    if (!session || !myMemberId) return false;
    const me = members.find((m) => m.id === myMemberId);
    return !!me?.userId && me.userId === session.hostId;
  }, [session, myMemberId, members]);

  const [joinUrl, setJoinUrl] = useState("");
  useEffect(() => {
    setJoinUrl(`${window.location.origin}/?join=${code}`);
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, [code]);

  const shareText = useMemo(
    () => `Join my Spinout session! Code: ${code}`,
    [code],
  );

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

  async function nativeShare() {
    try {
      await navigator.share({ title: "Spinout", text: shareText, url: joinUrl });
    } catch {
      /* user cancelled or unsupported */
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`${shareText}\n${joinUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
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

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-7 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="font-body font-extrabold text-xs tracking-[0.12em] uppercase text-muted mb-1">
              {connecting ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Connecting…
                </span>
              ) : (
                "Lobby"
              )}
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-ink">
              Get the crew together
            </h1>
          </div>

          {isHost && (
            <Button
              onClick={start}
              disabled={starting || members.length < 1}
              className="animate-pulse-glow"
            >
              {starting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : null}
              {starting ? "Starting…" : <><Disc3 size={18} strokeWidth={2.5} className="mr-1.5" />Start the spin</>}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-7 items-start">
          {/* Left: members + invite */}
          <div className="flex flex-col gap-7">
            {/* Members card */}
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-ink">
                  <Users size={20} strokeWidth={2.5} />
                  <h2 className="font-display font-bold text-xl">
                    In the lobby{members.length > 0 ? ` (${members.length})` : ""}
                  </h2>
                </div>

                <ul className="flex flex-col gap-2.5">
                  {members.map((m, idx) => {
                    const host = !!m.userId && m.userId === session?.hostId;
                    const ready = readyIds.has(m.id);
                    const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
                    return (
                      <li key={m.id} className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 shrink-0 rounded-full border-[2.5px] border-ink flex items-center justify-center font-display font-extrabold text-sm text-white"
                          style={{ background: color, boxShadow: "2px 2px 0 #3a2a24" }}
                        >
                          {memberName(m).charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 font-body font-bold text-ink text-sm">
                          {memberName(m)}
                          {m.id === myMemberId && (
                            <span className="text-muted font-normal ml-1">(you)</span>
                          )}
                        </span>
                        {host ? (
                          <span className="font-body font-extrabold text-[10px] tracking-[0.05em] bg-ink text-paper rounded-full px-2 py-0.5">
                            HOST
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "font-body font-extrabold text-[10px] rounded-full px-2 py-0.5 border-[1.5px] border-ink",
                              ready ? "bg-[#7A9A52] text-white" : "bg-surface text-muted",
                            )}
                          >
                            {ready ? "Ready" : "Picking…"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                  {members.length === 0 && (
                    <li className="font-body text-sm text-muted py-1">
                      No one here yet.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Invite card — dark background matching design */}
            <div
              className="rounded-[22px] border-[2.5px] border-ink p-6 text-paper text-center flex flex-col items-center gap-4"
              style={{ background: "#3A2A24", boxShadow: "5px 5px 0 #C9B6A1" }}
            >
              <h2 className="font-display font-bold text-lg">Invite the others</h2>

              <div className="bg-paper rounded-xl p-3 border-[2.5px] border-ink">
                {joinUrl ? (
                  <QRCodeSVG value={joinUrl} size={140} fgColor="#3a2a24" />
                ) : (
                  <div className="w-[140px] h-[140px]" />
                )}
              </div>

              <p className="font-body text-sm opacity-80">Scan to join · or share code</p>

              <button
                type="button"
                onClick={copyCode}
                className="font-display font-extrabold text-2xl tracking-[0.18em] text-paper flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {code}
                {copied ? (
                  <Check size={18} className="text-[#7A9A52]" strokeWidth={2.5} />
                ) : (
                  <Copy size={18} className="opacity-50" strokeWidth={2.5} />
                )}
              </button>

              <div className="flex gap-2 w-full">
                {canShare && (
                  <button
                    type="button"
                    onClick={nativeShare}
                    className="flex-1 inline-flex items-center justify-center gap-2 font-display font-bold text-sm px-3 py-2 bg-paper text-ink border-[2.5px] border-paper rounded-lg shadow-sticker-sm cursor-pointer active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-[transform,box-shadow] duration-75"
                  >
                    <Share2 size={16} strokeWidth={2.5} />
                    Share
                  </button>
                )}
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-2 font-display font-bold text-sm px-3 py-2 bg-[#25D366] text-white border-[2.5px] border-paper rounded-lg shadow-sticker-sm cursor-pointer active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-[transform,box-shadow] duration-75"
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden>
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.973-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 font-display font-bold text-sm px-3 py-2 bg-paper text-ink border-[2.5px] border-paper rounded-lg shadow-sticker-sm cursor-pointer active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-[transform,box-shadow] duration-75"
                  title="Copy invite link"
                >
                  {linkCopied ? (
                    <Check size={16} className="text-[#7A9A52]" strokeWidth={2.5} />
                  ) : (
                    <Link2 size={16} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: preferences */}
          <div className="flex flex-col gap-6">
            {/* Category grid */}
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-ink">
                    What&apos;s on the wheel?
                  </h2>
                  <p className="font-body text-sm text-subtle mt-1">
                    Tap a category to set your taste for it.
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {CATEGORY_KEYS.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const isActive = activeCategory === cat;
                    const isSaved = savedCategories.has(cat) && !isActive;
                    const isColored = isActive || isSaved;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => selectCategory(cat)}
                        className={cn(
                          "border-[2.5px] border-ink rounded-2xl py-4 px-2 text-center cursor-pointer select-none outline-none",
                          "shadow-sticker-sm transition-[transform,box-shadow,background-color] duration-75",
                          "active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none",
                          "focus-visible:ring-2 focus-visible:ring-primary",
                        )}
                        style={
                          isColored
                            ? { backgroundColor: meta.color, color: "#FFFFFF" }
                            : { backgroundColor: "#FFFCF6", color: "#3A2A24" }
                        }
                      >
                        {(() => { const Icon = CATEGORY_ICON[cat]; return <Icon size={28} strokeWidth={2} className="mb-2 mx-auto" color={isColored ? "#FFFCF6" : meta.color} />; })()}
                        <div className="font-display font-bold text-sm leading-tight">
                          {meta.label}
                        </div>
                        <div className="font-body font-extrabold text-[10px] uppercase tracking-wide mt-1 opacity-80 flex items-center justify-center gap-1">
                          {isSaved ? <><Check size={10} strokeWidth={3} />Set</> : isActive ? "editing…" : "tap to pick"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tag editor */}
            {activeCategory ? (
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                      {(() => { const Icon = CATEGORY_ICON[activeCategory]; return <Icon size={20} strokeWidth={2.5} style={{ color: CATEGORY_META[activeCategory].color }} />; })()}
                      {CATEGORY_META[activeCategory].label} vibes
                    </h3>
                    <p className="font-body text-sm text-subtle mt-0.5 flex items-center gap-1">
                      Tap to <ThumbsUp size={13} strokeWidth={2.5} className="inline text-[#7A9A52]" /> like, again to <ThumbsDown size={13} strokeWidth={2.5} className="inline text-muted" /> avoid.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_TAGS[activeCategory].map((tag) => {
                      const state = tagStates[tag];
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => cycleTag(tag)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body font-bold text-sm border-2 border-ink cursor-pointer select-none transition-[transform,box-shadow,background-color] duration-75",
                            "active:translate-x-[2px] active:translate-y-[2px]",
                            state === "like" && "bg-[#7A9A52] text-white shadow-sticker-sm",
                            state === "dislike" && "bg-paper text-muted border-dashed line-through",
                            !state && "bg-surface text-ink shadow-sticker-sm",
                          )}
                        >
                          {state === "like" && <ThumbsUp size={13} strokeWidth={2.5} />}
                          {state === "dislike" && <ThumbsDown size={13} strokeWidth={2.5} />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="text-base px-4 py-2"
                      onClick={() => { setActiveCategory(null); setTagStates({}); }}
                    >
                      Cancel
                    </Button>
                    <Button className="text-base px-4 py-2" onClick={savePreference}>
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="font-body text-sm text-muted bg-paper border-2 border-dashed border-muted rounded-xl px-4 py-6 text-center">
                Select a category above to set your taste.
              </p>
            )}

            {!isHost && (
              <p className="font-body font-bold text-center text-subtle text-sm">
                Waiting for the host to start…
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
