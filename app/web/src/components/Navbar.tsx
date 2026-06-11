"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Lobby", href: "/lobby" },
  { label: "Game", href: "/game" },
  { label: "History", href: "/history" },
];

export function Navbar() {
  const pathname = usePathname();

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
        {NAV_ITEMS.map((item) => {
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
