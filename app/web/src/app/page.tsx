"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Disc3,
  History,
  type LucideIcon,
  Rocket,
  Sparkles,
  Vote,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Wheel } from "@/components/Wheel";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import {
  createSession,
  getMembership,
  joinSession,
  storeMembership,
} from "@/lib/session";

const CODE_RE = /^[A-Z0-9]{6}$/;

const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Disc3, title: "Spin the wheel", desc: "Fate picks the activity." },
  { Icon: Vote, title: "Everyone votes", desc: "Yes or no, live." },
  { Icon: Rocket, title: "Just go", desc: "No more debating." },
];

export default function HomePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [joinOpen, setJoinOpen] = useState(false);
  const [initialCode, setInitialCode] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setLastCode(getMembership()?.code ?? null);

    const params = new URLSearchParams(window.location.search);
    const join = params.get("join");
    if (join && CODE_RE.test(join.toUpperCase())) {
      setInitialCode(join.toUpperCase());
      setJoinOpen(true);
    }
  }, []);

  async function handleCreate() {
    setCreateError(null);
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
    setCreating(true);
    try {
      const session = await createSession([]);
      const hostMember = session.members?.[0];
      if (hostMember) {
        storeMembership({ code: session.code, memberId: hostMember.id });
      }
      router.push(`/session/${session.code}/lobby`);
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Couldn't create the session.",
      );
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-7">
        <div className="grid lg:grid-cols-2 gap-10 items-center py-8 lg:py-16">
          {/* Left */}
          <div className="flex flex-col gap-6 lg:gap-7">
            <span className="self-start inline-flex items-center gap-2 bg-surface border-[2.5px] border-ink rounded-full px-4 py-1.5 font-body font-bold text-sm text-subtle shadow-sticker-sm">
              <Sparkles size={16} strokeWidth={2.5} className="text-amber" />
              for friend groups who can&apos;t decide
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-ink leading-[1.05]">
              Stop asking
              <br />
              &ldquo;what do we
              <br />
              wanna do?&rdquo;
            </h1>

            <p className="font-body text-lg text-subtle max-w-md">
              Gather your crew, spin the wheel, and let fate pick the plan.
              Everyone votes — then you just go.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create a session"}
              </Button>
              <Button variant="secondary" onClick={() => setJoinOpen(true)}>
                Join with a code
              </Button>
            </div>

            {lastCode && (
              <Link
                href={`/session/${lastCode}/history`}
                className="self-start inline-flex items-center gap-2 font-body font-bold text-sm text-subtle hover:text-ink transition-colors"
              >
                <History size={16} strokeWidth={2.5} />
                View last session history ({lastCode})
              </Link>
            )}

            {createError && (
              <p
                role="alert"
                className="bg-primary/10 border-[2.5px] border-primary rounded-lg px-4 py-2 font-body font-bold text-sm text-primary self-start"
              >
                {createError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 max-w-xl">
              {FEATURES.map((f) => {
                const { Icon } = f;
                return (
                  <Card key={f.title}>
                    <CardContent className="flex flex-col gap-1.5 p-4">
                      <Icon size={24} strokeWidth={2.5} className="text-primary" />
                      <span className="font-display font-bold text-ink leading-tight">
                        {f.title}
                      </span>
                      <span className="font-body text-sm text-muted leading-snug">
                        {f.desc}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right */}
          <div className="flex justify-center lg:justify-end">
            <Wheel size={260} className="animate-floaty sm:hidden" />
            <Wheel size={380} className="animate-floaty hidden sm:block" />
          </div>
        </div>
      </main>

      {joinOpen && (
        <JoinModal
          authed={authed}
          initialCode={initialCode}
          onClose={() => setJoinOpen(false)}
          onJoined={(code) => router.push(`/session/${code}/lobby`)}
        />
      )}
    </div>
  );
}

function JoinModal({
  authed,
  initialCode = "",
  onClose,
  onJoined,
}: {
  authed: boolean;
  initialCode?: string;
  onClose: () => void;
  onJoined: (code: string) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [guestName, setGuestName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = code.trim().toUpperCase();
    if (!CODE_RE.test(normalized)) {
      setError("Code must be 6 characters (letters/numbers).");
      return;
    }
    if (!authed && guestName.trim().length === 0) {
      setError("Enter a name to join as guest.");
      return;
    }

    setJoining(true);
    try {
      const { session, member } = await joinSession(
        normalized,
        authed ? undefined : guestName.trim(),
      );
      storeMembership({
        code: session.code,
        memberId: member.id,
        guestName: member.guestName ?? undefined,
      });
      onJoined(session.code);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 404
            ? "No session with this code."
            : err.status === 403
              ? "This session is closed."
              : err.message,
        );
      } else {
        setError("Couldn't join the session.");
      }
      setJoining(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-7"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="flex flex-col gap-5 p-7">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-display font-bold text-ink">
              Join a session
            </h2>
            <p className="font-body text-sm text-subtle">
              Enter the 6-character code.
            </p>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4" noValidate>
            <Input
              label="Session code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
              autoCapitalize="characters"
              placeholder="ABC123"
              className="tracking-[0.18em] uppercase font-display font-bold"
            />
            {!authed && (
              <Input
                label="Your name (guest)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={20}
                placeholder="Alex"
              />
            )}

            {error && (
              <p
                role="alert"
                className="bg-primary/10 border-[2.5px] border-primary rounded-lg px-4 py-2 font-body font-bold text-sm text-primary"
              >
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={joining} className="flex-1">
                {joining ? "Joining..." : "Join"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
