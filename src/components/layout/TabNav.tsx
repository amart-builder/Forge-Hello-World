"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Tasks", href: "/tasks" },
  { name: "Email", href: "/email" },
  { name: "CRM", href: "/crm" },
] as const;

export default function TabNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/crm") {
      return pathname.startsWith("/crm");
    }
    return pathname === href;
  }

  return (
    <nav className="flex items-center gap-1 px-6 py-3 border-b border-gray-200 bg-white">
      <span className="text-lg font-semibold text-gray-900 mr-6">Forge</span>
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive(tab.href)
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-current={isActive(tab.href) ? "page" : undefined}
          >
            {tab.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
