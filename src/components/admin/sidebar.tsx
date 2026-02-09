"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  Building2,
  Users,
  Bell,
  Package,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin/submissions", label: "Meldungen", icon: FileText },
  { href: "/admin/objects", label: "Objekte", icon: Building2 },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/notifications", label: "Benachrichtigungen", icon: Bell },
  { href: "/admin/materials", label: "Materialien", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications?status=open&countOnly=true");
        const data = await res.json();
        setNotifCount(data.count || 0);
      } catch {
        // ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 border-r bg-card min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">Materialverbrauch</h1>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/notifications" && notifCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {notifCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Link>
      </div>
    </aside>
  );
}
