"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const subTabs = [
  { name: "Contacts", href: "/crm/contacts" },
  { name: "Companies", href: "/crm/companies" },
  { name: "Pipelines", href: "/crm/pipelines" },
  { name: "Analytics", href: "/crm/analytics" },
] as const;

export default function CrmSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-100 bg-gray-50">
      {subTabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            pathname === tab.href
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
          }`}
          aria-current={pathname === tab.href ? "page" : undefined}
        >
          {tab.name}
        </Link>
      ))}
    </div>
  );
}
