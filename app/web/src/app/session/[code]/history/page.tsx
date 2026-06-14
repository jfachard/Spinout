"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
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
  ScrollText,
  TreePine,
  UtensilsCrossed,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CATEGORY_META,
  type CategoryKey,
} from "@/components/ui/CategoryChip";
import { fetchSessionHistory, type HistorySpin } from "@/lib/session";
import { cn } from "@/lib/utils";

const HISTORY_KEY = (code: string) => `spinout.history.${code}`;

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

export default function HistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [spins, setSpins] = useState<HistorySpin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const raw = sessionStorage.getItem(HISTORY_KEY(code));
    if (raw) {
      try {
        setSpins(JSON.parse(raw) as HistorySpin[]);
        setLoading(false);
      } catch {
        /* ignore */
      }
    }

    fetchSessionHistory(code)
      .then((data) => {
        if (cancelled) return;
        setSpins(data.spins);
        sessionStorage.setItem(HISTORY_KEY(code), JSON.stringify(data.spins));
      })
      .catch((err) => {
        if (cancelled || raw) return;
        setError(err instanceof Error ? err.message : "Session not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const acceptedCount = spins.filter((s) => s.result === "accepted").length;
  const passedCount = spins.length - acceptedCount;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-7 py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="font-body font-extrabold text-xs tracking-[0.12em] uppercase text-muted mb-1">
              Session recap
            </div>
            <h1 className="text-4xl font-display font-extrabold text-ink flex items-center gap-3">
              Tonight&apos;s spins
              <ScrollText size={32} strokeWidth={2} />
            </h1>
          </div>
          <Link href={`/session/${code}/game`}>
            <Button className="inline-flex items-center gap-2">
              <RotateCcw size={16} strokeWidth={2.5} />
              Spin again
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        {spins.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div
              className="rounded-[18px] border-[2.5px] border-ink px-5 py-4"
              style={{ background: "#3A2A24", color: "#FBF3E4", boxShadow: "4px 4px 0 #C9B6A1" }}
            >
              <div className="font-display font-extrabold text-3xl leading-none">
                {spins.length}
              </div>
              <div className="font-body font-bold text-sm opacity-85 mt-1.5">
                total spins
              </div>
            </div>
            <div
              className="rounded-[18px] border-[2.5px] border-ink px-5 py-4"
              style={{ background: "#7A9A52", color: "#FFF", boxShadow: "4px 4px 0 #3a2a24" }}
            >
              <div className="font-display font-extrabold text-3xl leading-none">
                {acceptedCount}
              </div>
              <div className="font-body font-bold text-sm opacity-92 mt-1.5 flex items-center gap-1.5">
                <Check size={14} strokeWidth={2.5} /> accepted
              </div>
            </div>
            <div
              className="rounded-[18px] border-[2.5px] border-ink px-5 py-4 bg-surface"
              style={{ boxShadow: "4px 4px 0 #3a2a24" }}
            >
              <div className="font-display font-extrabold text-3xl leading-none text-ink">
                {passedCount}
              </div>
              <div className="font-body font-bold text-sm text-subtle mt-1.5">
                passed on
              </div>
            </div>
          </div>
        )}

        {loading && spins.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 size={28} className="animate-spin mx-auto text-muted" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-body text-subtle mb-4">{error}</p>
              <Link href="/"><Button>Back home</Button></Link>
            </CardContent>
          </Card>
        ) : spins.length === 0 ? (
          <div className="bg-surface border-[2.5px] border-dashed border-muted rounded-2xl p-12 text-center">
            <Disc3 size={48} strokeWidth={1.5} className="mx-auto mb-3 text-muted" />
            <p className="font-display font-extrabold text-xl text-ink mb-1">
              No spins yet
            </p>
            <p className="font-body text-sm text-subtle mb-5">
              Head to the game and give the wheel a whirl.
            </p>
            <Link href={`/session/${code}/game`}>
              <Button className="inline-flex items-center gap-2">
                <Disc3 size={16} strokeWidth={2.5} />
                Go spin
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {spins.map((spin) => {
              const yes = spin.votes.filter((v) => v.value).length;
              const no = spin.votes.length - yes;
              const accepted = spin.result === "accepted";
              const catKey = isCategoryKey(spin.activity.category)
                ? spin.activity.category
                : null;
              const catMeta = catKey ? CATEGORY_META[catKey] : null;
              const CatIcon = catKey ? CATEGORY_ICON[catKey] : null;

              return (
                <li key={spin.id}>
                  <div
                    className="flex items-center gap-4 bg-surface border-[2.5px] border-ink rounded-[18px] px-4 py-4"
                    style={{ boxShadow: "3px 3px 0 #3a2a24" }}
                  >
                    {/* Category emoji box */}
                    <span
                      className="w-[52px] h-[52px] shrink-0 rounded-[14px] border-[2.5px] border-ink flex items-center justify-center"
                      style={{ background: catMeta?.color ?? "#E8643C" }}
                    >
                      {CatIcon ? (
                        <CatIcon size={26} strokeWidth={2.5} color="#FFFCF6" />
                      ) : (
                        <span className="text-2xl leading-none">🎲</span>
                      )}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-extrabold text-lg text-ink leading-tight truncate">
                        {spin.activity.title}
                      </div>
                      <div className="font-body font-bold text-xs text-muted mt-0.5">
                        {catMeta?.label ?? spin.activity.category} · 👍{yes} · 👎{no}
                      </div>
                    </div>

                    {/* Status badge */}
                    {accepted ? (
                      <span
                        className="font-body font-extrabold text-xs text-white rounded-full px-3 py-1.5 border-[2.5px] border-ink shrink-0 whitespace-nowrap inline-flex items-center gap-1"
                        style={{ background: "#7A9A52", boxShadow: "2px 2px 0 #3a2a24" }}
                      >
                        <Check size={11} strokeWidth={3} /> Accepted
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "font-body font-extrabold text-xs rounded-full px-3 py-1.5 border-[2.5px] border-dashed border-[#C9836A] shrink-0 whitespace-nowrap",
                        )}
                        style={{ color: "#C9533A", background: "#FFFCF6" }}
                      >
                        Passed
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Button variant="secondary">New session</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
