"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const DEFAULT_NAV = [{ label: "Home", href: "/" }];

function sessionNav(code: string) {
  return [
    { label: "Home", href: "/" },
    { label: "Lobby", href: `/session/${code}/lobby` },
    { label: "Game", href: `/session/${code}/game` },
    { label: "History", href: `/session/${code}/history` },
  ];
}

export function Navbar() {
  const pathname = usePathname();
  const sessionMatch = pathname.match(/^\/session\/([^/]+)/);
  const navItems = sessionMatch
    ? sessionNav(sessionMatch[1])
    : DEFAULT_NAV;

  return (
    <header className="w-full max-w-[1120px] mx-auto px-7 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex items-center justify-center w-10 h-10 overflow-hidden">
          <Image
            src="/Spinout_logo.png"
            alt="Spinout"
            width={32}
            height={32}
            className="object-contain"
          />
        </span>
        <span className="text-xl font-display font-extrabold text-ink">
          Spinout
        </span>
      </Link>

      <nav className="flex items-center gap-1 bg-surface border-[2.5px] border-ink rounded-full shadow-sticker-sm p-1">
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
                "px-4 py-1.5 rounded-full font-body font-bold text-sm transition-colors",
                active
                  ? "bg-ink text-paper"
                  : "text-subtle hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
