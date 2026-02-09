"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Bell, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface NotificationData {
  id: number;
  type: string;
  dehpNumber: string;
  firstTriggeredAt: string;
  lastSeenCount: number;
  isClosed: boolean;
  closedAt: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "closed" | "all">("open");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/notifications${params}`);
    const json = await res.json();
    setNotifications(json.data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const closeNotification = async (id: number) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isClosed: true }),
    });
    fetchNotifications();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Benachrichtigungen</h2>
        <div className="flex gap-2">
          {(["open", "closed", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "open" ? "Offen" : f === "closed" ? "Geschlossen" : "Alle"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Keine Benachrichtigungen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    DEHP Duplikat: {" "}
                    <Link
                      href={`/admin/objects/${encodeURIComponent(notif.dehpNumber)}`}
                      className="text-primary hover:underline"
                    >
                      {notif.dehpNumber}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={notif.isClosed ? "secondary" : "destructive"}>
                      {notif.isClosed ? "Geschlossen" : "Offen"}
                    </Badge>
                    {!notif.isClosed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeNotification(notif.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Schließen
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {notif.lastSeenCount} Meldungen für dieses Objekt.
                  Erstmals gemeldet:{" "}
                  {format(new Date(notif.firstTriggeredAt), "dd.MM.yyyy HH:mm")}
                  {notif.closedAt &&
                    ` | Geschlossen: ${format(new Date(notif.closedAt), "dd.MM.yyyy HH:mm")}`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
