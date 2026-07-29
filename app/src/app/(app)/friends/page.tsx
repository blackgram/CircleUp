"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Search, Check, X, Trash2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useFriends, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useRemoveFriend, useSearchUsers } from "@/hooks/useFriends";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function FriendsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests();
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(tab === "search" ? searchQuery : "");
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const removeFriend = useRemoveFriend();

  if (!isAuthenticated()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" /> Friends
        </h1>
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <Users className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">Connect with friends</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Sign in to add friends and play together.</p>
          <Button onClick={openAuthModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const pendingCount = requests?.filter((r) => r.type === "incoming").length || 0;
  const friendIds = new Set(friends?.map((f) => f.id) || []);
  const requestedIds = new Set(requests?.filter((r) => r.type === "outgoing").map((r) => r.id) || []);

  async function handleSendRequest(userId: string, nickname: string) {
    try {
      await sendRequest.mutateAsync(userId);
      setSentIds((prev) => new Set(prev).add(userId));
      toast.success(`Friend request sent to ${nickname}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Friends</h2>
        <p className="text-xs text-slate-500">Find players, send requests, and manage your circle.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
        <button
          onClick={() => setTab("friends")}
          className={`px-4 py-2 rounded-lg transition-all ${tab === "friends" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          Friends ({friends?.length || 0})
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-lg transition-all relative ${tab === "requests" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          Requests
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("search")}
          className={`px-4 py-2 rounded-lg transition-all ${tab === "search" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          <Search className="w-3.5 h-3.5 inline mr-1" /> Find
        </button>
      </div>

      {/* ── SEARCH TAB ── */}
      {tab === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by nickname or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
              autoFocus
            />
          </div>

          {searchQuery.length < 2 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Search for players</p>
              <p className="text-sm text-slate-500 mt-1">Type at least 2 characters to find users.</p>
            </div>
          )}

          {searchQuery.length >= 2 && searchLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searchLoading && searchResults && (
            <div className="space-y-3">
              {searchResults.filter((u) => u.id !== user?.id).length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                  <p className="font-semibold text-slate-700">No users found</p>
                  <p className="text-sm text-slate-500 mt-1">Try a different search term.</p>
                </div>
              ) : (
                searchResults.filter((u) => u.id !== user?.id).map((result) => {
                  const isFriend = friendIds.has(result.id);
                  const isPending = sentIds.has(result.id) || requestedIds.has(result.id);
                  return (
                    <div key={result.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                      <button onClick={() => router.push(`/user/${result.id}`)} className="flex items-center gap-3 flex-1 text-left">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                          {result.nickname[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{result.displayName || result.nickname}</p>
                          <p className="text-xs text-slate-500">@{result.nickname}</p>
                        </div>
                      </button>
                      {isFriend ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Friends</span>
                      ) : isPending ? (
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Sent</span>
                      ) : (
                        <Button
                          onClick={() => handleSendRequest(result.id, result.nickname)}
                          disabled={sendRequest.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-3 py-1.5 h-auto"
                        >
                          {sendRequest.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1" />}
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FRIENDS TAB ── */}
      {tab === "friends" && (
        <div className="space-y-3">
          {friendsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : friends && friends.length > 0 ? (
            friends.map((friend) => (
              <div key={friend.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                <button onClick={() => router.push(`/user/${friend.id}`)} className="flex items-center gap-3 flex-1 text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                    {friend.displayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{friend.displayName}</p>
                    <p className="text-xs text-slate-500">@{friend.nickname}</p>
                  </div>
                </button>
                <button
                  onClick={() => { removeFriend.mutate(friend.id); toast.success("Friend removed"); }}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No friends yet</p>
              <p className="text-sm text-slate-500 mt-1">Use the Find tab to search for players and send requests.</p>
            </div>
          )}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {requestsLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /></div>
              </div>
            ))
          ) : requests && requests.length > 0 ? (
            requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    req.type === "incoming" ? "bg-gradient-to-br from-emerald-500 to-cyan-600" : "bg-gradient-to-br from-slate-400 to-slate-500"
                  }`}>
                    {req.displayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{req.displayName}</p>
                    <p className="text-xs text-slate-500">
                      @{req.nickname} · {req.type === "incoming" ? "Wants to be your friend" : "Request sent"}
                    </p>
                  </div>
                </div>
                {req.type === "incoming" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { acceptRequest.mutate(req.id); toast.success("Friend request accepted!"); }}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { rejectRequest.mutate(req.id); toast.info("Request rejected"); }}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Pending</span>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <UserPlus className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No pending requests</p>
              <p className="text-sm text-slate-500 mt-1">When someone adds you, they&apos;ll show up here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
