"use client";

import {
  Dumbbell,
  Flower2,
  House,
  type LucideIcon,
  Palette,
  PartyPopper,
  TreePine,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryKey =
  | "indoor"
  | "outdoor"
  | "sport"
  | "relaxation"
  | "party"
  | "culture"
  | "food";

export const CATEGORY_META: Record<
  CategoryKey,
  { label: string; color: string }
> = {
  indoor:     { label: "Indoor",  color: "#E8643C" },
  outdoor:    { label: "Outdoor", color: "#7A9A52" },
  sport:      { label: "Sport",   color: "#F2A03D" },
  relaxation: { label: "Relax",   color: "#6F94A8" },
  party:      { label: "Party",   color: "#D1688A" },
  culture:    { label: "Culture", color: "#9B72CF" },
  food:       { label: "Food",    color: "#C98A3A" },
};

const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  indoor:     House,
  outdoor:    TreePine,
  sport:      Dumbbell,
  relaxation: Flower2,
  party:      PartyPopper,
  culture:    Palette,
  food:       UtensilsCrossed,
};

export interface CategoryChipProps {
  category: CategoryKey;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryChip({
  category,
  selected = false,
  onClick,
  className,
}: CategoryChipProps) {
  const meta = CATEGORY_META[category];
  const Icon = CATEGORY_ICON[category];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-3 py-1 rounded-full",
        "font-body font-bold text-sm",
        "border-2 border-ink shadow-sticker-sm",
        "cursor-pointer select-none outline-none",
        "transition-[transform,box-shadow,background-color,color] duration-75 ease-out",
        "active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        selected ? "text-white" : "bg-surface text-ink",
        className,
      )}
      style={selected ? { backgroundColor: meta.color } : undefined}
      aria-pressed={selected}
    >
      <Icon size={14} strokeWidth={2.5} aria-hidden />
      {meta.label}
    </button>
  );
}
