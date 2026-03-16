import { useEffect, useMemo, useState } from "react";
import { ListPane } from "@/components/layout/ListPane";
import { WorkPane } from "@/components/layout/WorkPane";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, MailOpen, Mail } from "lucide-react";
import { getDataProvider } from "@/lib/data";
import { useApp } from "@/context/AppContext";
import type { NotificationItem } from "@/types/overview";
import { supabase } from "@/lib/supabase";
import { isMockBackend } from "@/lib/data";

const formatTimestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "N/A";

const renderPayload = (payload: Record<string, any>) => {
  if (!payload || Object.keys(payload).length === 0) return "No payload data";
  return JSON.stringify(payload, null, 2);
};

/**
 * NotificationsCenterPage
 * Notification feed with read/unread actions.
 */
export function NotificationsCenterPage() {
  const { currentTenant } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    async function fetchUser() {
      if (isMockBackend()) {
        setCurrentUserId("u1");
        return;
      }

      try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          return;
        }

        // Fallback: Fetch the first user from the tenant if no auth user is found
        // Useful for demo/dev environments where auth might not be fully active
        const provider = getDataProvider();
        const profiles = await provider.getUserProfiles(currentTenant.id);
        if (profiles && profiles.length > 0) {
          console.info(`NotificationsCenterPage: No auth user, falling back to profile: ${profiles[0].displayName}`);
          setCurrentUserId(profiles[0].userId);
        } else {
          console.warn("NotificationsCenterPage: No authenticated user or profiles found");
        }
      } catch (err) {
        console.error("NotificationsCenterPage: Error fetching user/profiles", err);
      }
    }
    fetchUser();
  }, [currentTenant.id]);

  useEffect(() => {
    async function fetchNotifications() {
      if (!currentUserId) return;

      setIsLoading(true);
      setError(null);
      try {
        const provider = getDataProvider();
        const data = await provider.getNotifications(currentTenant.id, currentUserId);
        setNotifications(data);
        if (data.length > 0) {
          setSelectedNotification(prev => prev ?? data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load notifications");
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();
  }, [currentTenant.id, currentUserId]);

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notifications;
    return notifications.filter((item) => {
      const payloadString = JSON.stringify(item.payload || {}).toLowerCase();
      return (
        item.type.toLowerCase().includes(query) ||
        payloadString.includes(query)
      );
    });
  }, [notifications, searchQuery]);

  const markAsRead = async (notification: NotificationItem) => {
    if (notification.readAt) return;
    try {
      const provider = getDataProvider();
      const updated = await provider.markNotificationRead(notification.id);
      setNotifications((prev) => prev.map(item => (item.id === updated.id ? updated : item)));
      if (selectedNotification?.id === updated.id) {
        setSelectedNotification(updated);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const tabs = [
    {
      id: "details",
      label: "Notification Details",
      content: selectedNotification ? (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedNotification.type}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Received {formatTimestamp(selectedNotification.createdAt)}
              </p>
            </div>
            <Badge variant={selectedNotification.readAt ? "secondary" : "default"}>
              {selectedNotification.readAt ? "Read" : "Unread"}
            </Badge>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-xs font-mono whitespace-pre-wrap">
            {renderPayload(selectedNotification.payload)}
          </div>
          {!selectedNotification.readAt && (
            <Button onClick={() => markAsRead(selectedNotification)} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Mark as Read
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Select a notification to view details</p>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <ListPane
        title="Notifications"
        subtitle="Recent platform updates"
        count={filteredNotifications.length}
        actions={
          <div className="relative w-full mt-2">
            <MailOpen className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-8 h-9 text-sm"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        }
      >
        <div className="space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">
              <p className="text-sm">{error}</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedNotification(item)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 border",
                  selectedNotification?.id === item.id
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "hover:bg-secondary/50 border-transparent"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  item.readAt ? "bg-muted" : "bg-primary/10"
                )}>
                  {item.readAt ? (
                    <MailOpen className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Mail className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      selectedNotification?.id === item.id ? "text-primary" : "text-foreground"
                    )}>
                      {item.type}
                    </span>
                    {!item.readAt && (
                      <Badge variant="default" className="text-[9px] h-4 px-1.5 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {item.payload?.summary || item.payload?.message || "Notification update"}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 capitalize">
                        {item.readAt ? "Read" : "Unread"}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-10 opacity-50">
              <p className="text-sm">No notifications found</p>
            </div>
          )}
        </div>
      </ListPane>
      <WorkPane
        title={selectedNotification?.type || "Notification Details"}
        subtitle={selectedNotification ? "Notification payload and metadata" : "Stay up to date"}
        tabs={tabs}
      />
    </div>
  );
}