"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";

import type { TNavigationMenuProps } from "./types";

export type { TNavigationMenuItem } from "./types";

export function NavigationMenu({ items }: TNavigationMenuProps) {
  const pathname = usePathname();
  return (
    <nav className="w-full flex justify-center py-4 bg-neutral-900 text-neutral-100 border-b border-neutral-800">
      <ul className="flex gap-8">
        {items.map(({ href, label, icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "px-3 py-1 rounded transition-colors duration-150 flex items-center gap-2",
                pathname === href
                  ? "bg-neutral-800 text-white font-semibold"
                  : "hover:bg-neutral-800 hover:text-white"
              )}
            >
              {icon && <span className="text-lg">{icon}</span>}
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
