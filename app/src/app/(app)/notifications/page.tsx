"use client";

import { Bell, CheckCheck, Trash2, Radio, UserPlus, Trophy, Info } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useClearNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationResponse } from "@/types";

function getNotificationIcon(type: string) {
  switch (type) {
    case "ROOM_INVITE": return <Radio className="w-4 h-4 text-indigo-500" />;
    case "FRIEND_REQUEST":
    case "FRIEND_ACCEPTED": return <UserPlus className="w-4 h-4 text-emerald-500" />;
    case "ACHIEVEMENT": return <Trophy className="w-4 h-4 text-amber-500" />;
    case "GAME_STARTED":
    case "GAME_FINISHED": return <Trophy className="w-4 h-4 text-violet-500" />;
    default: return <Info className="w-4 h-4 text-cyan-500" />;
  }
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearNotifications();

  if (!isAuthenticated()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-600" /> Notifications
        </h1>
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <Bell className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">Stay in the loop</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Sign in to see your notifications.</p>
          <Button onClick={openAuthModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Notifications
          </h2>
          <p className="text-xs text-slate-500">Real-time invites, friend requests, and alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => markAllRead.mutate()} variant="outline" className="text-xs font-bold rounded-xl px-3 py-1.5">
            <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark All Read
          </Button>
          <Button onClick={() => clearAll.mutate()} variant="outline" className="text-xs font-bold rounded-xl px-3 py-1.5 text-rose-600 hover:text-rose-700">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif: NotificationResponse) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markRead.mutate(notif.id)}
              className={`bg-white rounded-2xl p-4 border shadow-sm flex items-start gap-3 cursor-pointer transition-all hover:shadow-md ${
                notif.read ? "border-slate-100 opacity-70" : "border-indigo-100 bg-indigo-50/30"
              }`}
            >
              <div className={`p-2.5 rounded-xl ${notif.read ? "bg-slate-100" : "bg-indigo-100"}`}>
                {getNotificationIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(notif.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!notif.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <Bell className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No notifications</p>
          <p className="text-sm text-slate-500 mt-1">You&apos;re all caught up!</p>
        </div>
      )}
    </div>
  );
}
