"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  CATEGORY_META,
  CategoryChip,
  type CategoryKey,
} from "@/components/ui/CategoryChip";
import { fetchSessionHistory, type HistorySpin } from "@/lib/session";
import { cn } from "@/lib/utils";

const HISTORY_KEY = (code: string) => `spinout.history.${code}`;

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

    // Show the cached recap instantly (set on session:closed), then refresh from the API.
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
        setError(err instanceof Error ? err.message : "Session introuvable");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const accepted = spins.filter((s) => s.result === "accepted");

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-[720px] mx-auto px-7 py-8 lg:py-10">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 self-start bg-muted/20 border-[2.5px] border-ink rounded-full px-3 py-1 font-body font-bold text-xs text-ink mb-2">
            Session {code}
          </span>
          <h1 className="text-4xl font-display font-extrabold text-ink">
            History
          </h1>
          <p className="font-body text-subtle mt-1">
            {accepted.length} accepted · {spins.length} total spins
          </p>
        </div>

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
              <Link href="/">
                <Button>Back home</Button>
              </Link>
            </CardContent>
          </Card>
        ) : spins.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="font-body text-subtle mb-4">
                No history yet for this session.
              </p>
              <Link href="/">
                <Button>Back home</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {spins.map((spin) => {
              const yes = spin.votes.filter((v) => v.value).length;
              const no = spin.votes.length - yes;
              const acceptedSpin = spin.result === "accepted";

              return (
                <li key={spin.id}>
                  <Card
                    className={cn(
                      acceptedSpin && "ring-2 ring-[#7A9A52] ring-offset-2",
                    )}
                  >
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-body text-xs font-bold text-muted">
                            Spin #{spin.spinNumber}
                          </span>
                          <h2 className="font-display font-extrabold text-xl text-ink">
                            {spin.activity.title}
                          </h2>
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-body font-bold text-xs px-2.5 py-1 rounded-full border-2 border-ink shrink-0",
                            acceptedSpin
                              ? "bg-[#7A9A52] text-white"
                              : "bg-[#C44B4B] text-white",
                          )}
                        >
                          {acceptedSpin ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                          {spin.result}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isCategoryKey(spin.activity.category) ? (
                          <CategoryChip
                            category={spin.activity.category}
                            selected
                          />
                        ) : (
                          <span className="font-body text-sm capitalize text-subtle">
                            {spin.activity.category}
                          </span>
                        )}
                        <span className="font-body text-sm text-muted">
                          {yes} yes · {no} no
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Button>New session</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
