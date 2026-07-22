"use client";

import { useState } from "react";
import { Users, UserPlus, Search, Check, X, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useFriends, useFriendRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useRemoveFriend, useSearchUsers } from "@/hooks/useFriends";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function FriendsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [addInput, setAddInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests();
  const { data: searchResults } = useSearchUsers(searchQuery);
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

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!addInput.trim()) return;
    try {
      await sendRequest.mutateAsync(addInput.trim());
      setSuccessMsg(`Friend request sent!`);
      setAddInput("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {}
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Friends & Circles</h2>
          <p className="text-xs text-slate-500">Connect with friends, manage requests, and send game invites.</p>
        </div>
        <form onSubmit={handleSendRequest} className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="User ID to add..."
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            className="w-full sm:w-48 rounded-xl text-xs"
          />
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-3">
            <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </form>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
        <button
          onClick={() => setTab("friends")}
          className={`px-4 py-2 rounded-lg transition-all ${tab === "friends" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
        >
          All Friends ({friends?.length || 0})
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
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Content */}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                    {friend.displayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{friend.displayName}</p>
                    <p className="text-xs text-slate-500">@{friend.nickname}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend.mutate(friend.id)}
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
              <p className="text-sm text-slate-500 mt-1">Add friends using their user ID above.</p>
            </div>
          )}
        </div>
      )}

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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-sm font-bold text-white">
                    {req.displayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{req.displayName}</p>
                    <p className="text-xs text-slate-500">
                      {req.type === "incoming" ? "Wants to be your friend" : "Request sent"}
                    </p>
                  </div>
                </div>
                {req.type === "incoming" ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => acceptRequest.mutate(req.id)} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => rejectRequest.mutate(req.id)} className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
