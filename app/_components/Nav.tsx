"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };
type NavGroup = { heading: string; links: NavLink[] };

const GROUPS: NavGroup[] = [
  {
    heading: "Preconfigured scenarios",
    links: [
      { href: "/scenarios", label: "Latest (v0.15)" },
      { href: "/scenarios/v14", label: "SDK v0.14" },
    ],
  },
  {
    heading: "Manual query builder",
    links: [
      { href: "/manual", label: "Standard" },
      { href: "/manual/evm", label: "EVM" },
    ],
  },
];

/**
 * Subtle top bar to switch between the testing flows. Grouped by kind
 * (preconfigured scenarios vs. manual query builder); the active route is
 * highlighted.
 */
export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-gray-200 bg-white/80 backdrop-blur px-4 py-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 text-xs">
        {GROUPS.map((group) => (
          <div key={group.heading} className="flex items-center gap-2">
            <span className="text-gray-400">{group.heading}:</span>
            {group.links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "font-semibold text-gray-900 underline underline-offset-4"
                      : "text-gray-500 hover:text-gray-800"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
