"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const DEFAULT_NAV = [{ label: "Home", href: "/" }];

function sessionNav(code: string) {
  return [
    { label: "Lobby", href: `/session/${code}/lobby` },
    { label: "Game", href: `/session/${code}/game` },
    { label: "History", href: `/session/${code}/history` },
  ];
}

export function Navbar() {
  const pathname = usePathname();
  const sessionMatch = pathname.match(/^\/session\/([^/]+)/);
  const sessionCode = sessionMatch?.[1];
  const navItems = sessionCode ? sessionNav(sessionCode) : DEFAULT_NAV;

  return (
    <header
      className="sticky top-0 z-40 w-full border-b-[2.5px] border-ink backdrop-blur"
      style={{ background: "rgba(251,243,228,0.88)" }}
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-7 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex items-center justify-center w-9 h-9 overflow-hidden">
            <Image
              src="/Spinout_logo.png"
              alt="Spinout"
              width={28}
              height={28}
              className="object-contain"
            />
          </span>
          <span className="text-xl font-display font-extrabold text-ink">
            Spinout
          </span>
        </Link>

        <nav className="flex items-center justify-center gap-0.5 sm:gap-1 bg-surface border-[2.5px] border-ink rounded-full shadow-sticker-sm p-1 max-w-full overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 px-3 sm:px-4 py-1.5 rounded-full font-body font-bold text-xs sm:text-sm transition-colors whitespace-nowrap",
                  active ? "bg-ink text-paper" : "text-subtle hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {sessionCode && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="font-body font-extrabold text-xs text-muted hidden sm:block">
              CODE
            </span>
            <span className="font-display font-extrabold text-sm tracking-[0.14em] bg-ink text-paper px-3 py-1.5 rounded-[10px]">
              {sessionCode}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
