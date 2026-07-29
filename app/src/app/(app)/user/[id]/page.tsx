"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/services";
import { useAuthStore } from "@/stores/auth";
import { useSendFriendRequest, useFriends } from "@/hooks/useFriends";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Gamepad2, Trophy, Zap, Calendar, UserPlus, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const sendRequest = useSendFriendRequest();
  const { data: friends } = useFriends();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data } = await usersApi.getById(userId);
      return data.data;
    },
    enabled: !!userId,
  });

  const isSelf = currentUser?.id === userId;
  const isFriend = friends?.some((f) => f.id === userId) || false;

  async function handleAddFriend() {
    try {
      await sendRequest.mutateAsync(userId);
      toast.success("Friend request sent!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-12">
        <Skeleton className="h-24 rounded-3xl" />
        <div className="flex items-end gap-4 -mt-10 px-6">
          <Skeleton className="w-20 h-20 rounded-2xl" />
          <div className="space-y-2 flex-1 pt-12">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 px-6">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <User className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">User not found</p>
          <p className="text-sm text-slate-500 mt-1">This profile doesn&apos;t exist.</p>
          <Button onClick={() => router.back()} variant="outline" className="mt-4 rounded-xl font-bold text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg">
              {profile.displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 pt-12">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{profile.displayName}</h2>
                  <p className="text-sm text-slate-500">@{profile.nickname}</p>
                </div>
                {!isSelf && (
                  isFriend ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                      <Check className="w-3.5 h-3.5" /> Friends
                    </span>
                  ) : (
                    <Button
                      onClick={handleAddFriend}
                      disabled={sendRequest.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl px-3"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Friend
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <Gamepad2 className="w-4 h-4 mx-auto text-indigo-500 mb-2" />
          <p className="text-xl font-extrabold text-slate-900">{profile.gamesPlayed}</p>
          <p className="text-xs font-semibold text-slate-500">Played</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <Trophy className="w-4 h-4 mx-auto text-emerald-500 mb-2" />
          <p className="text-xl font-extrabold text-slate-900">{profile.gamesWon}</p>
          <p className="text-xs font-semibold text-slate-500">Won</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <Zap className="w-4 h-4 mx-auto text-cyan-500 mb-2" />
          <p className="text-xl font-extrabold text-slate-900">{winRate}%</p>
          <p className="text-xs font-semibold text-slate-500">Win Rate</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <Calendar className="w-4 h-4 mx-auto text-violet-500 mb-2" />
          <p className="text-xl font-extrabold text-slate-900">
            {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </p>
          <p className="text-xs font-semibold text-slate-500">Joined</p>
        </div>
      </div>
    </div>
  );
}
