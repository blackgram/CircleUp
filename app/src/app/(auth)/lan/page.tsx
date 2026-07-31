/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setLanHost, getApiUrl } from "@/lib/api/client";
import { disconnectSocket } from "@/lib/socket/client";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Loader2, Wifi, Monitor, ArrowLeft } from "lucide-react";
import type { ApiResponse, AuthResponse } from "@/types";

type Mode = "choose" | "host" | "join";

export default function LanPage() {
  const [mode, setMode] = useState<Mode>("choose");
  const [nickname, setNickname] = useState("");
  const [hostIp, setHostIp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lanInfo, setLanInfo] = useState<{ ip: string; port: number; url: string } | null>(null);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  async function handleHost() {
    setMode("host");
    setError("");
    // Fetch LAN info from local server
    try {
      const { data } = await api.get("/health/lan");
      if (data.success && data.data) {
        setLanInfo(data.data);
      }
    } catch {
      // Server might not be running locally
      setLanInfo(null);
    }
  }

  async function handleJoinAsGuest() {
    if (!nickname.trim()) {
      setError("Enter a nickname");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // If joining someone else's server, set the LAN host first
      if (mode === "join" && hostIp.trim()) {
        const url = hostIp.startsWith("http") ? hostIp.trim() : `http://${hostIp.trim()}`;
        setLanHost(url);
        disconnectSocket(); // Reset socket to use new URL
      } else if (mode === "host") {
        // Host uses local server
        setLanHost(null);
        disconnectSocket();
      }

      const { data } = await api.post<ApiResponse<AuthResponse>>("/api/auth/guest", {
        nickname: nickname.trim(),
      });

      if (data.success && data.data) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
        router.push("/dashboard");
      } else {
        setError(data.message || "Failed to join");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Cannot connect to server");
      // Reset LAN host on failure
      if (mode === "join") {
        setLanHost(null);
      }
    } finally {
      setLoading(false);
    }
  }

  if (mode === "choose") {
    return (
      <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 p-6 text-white">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-white text-lg font-extrabold">
              <Wifi className="w-5 h-5" />
              LAN Play
            </CardTitle>
            <CardDescription className="text-cyan-100 mt-1">
              Play with friends on the same network — no internet needed.
            </CardDescription>
          </CardHeader>
        </div>
        <CardContent className="p-6 space-y-4">
          <button
            onClick={handleHost}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Monitor className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Host a Game</p>
              <p className="text-xs text-slate-500">Run the server on this device</p>
            </div>
          </button>

          <button
            onClick={() => { setMode("join"); setError(""); }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-cyan-300 hover:bg-cyan-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Join a Game</p>
              <p className="text-xs text-slate-500">Connect to a host on your network</p>
            </div>
          </button>

          <div className="pt-2">
            <Link href="/login" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 p-6 text-white">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-white text-lg font-extrabold">
            <Wifi className="w-5 h-5" />
            {mode === "host" ? "Host Game" : "Join Game"}
          </CardTitle>
          <CardDescription className="text-cyan-100 mt-1">
            {mode === "host"
              ? "Others on your network can connect to this device."
              : "Enter the host's IP address to connect."}
          </CardDescription>
        </CardHeader>
      </div>
      <CardContent className="p-6 space-y-4">
        {/* LAN info for host */}
        {mode === "host" && lanInfo?.url && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 space-y-1">
            <p className="text-xs font-bold text-indigo-600 uppercase">Your LAN Address</p>
            <p className="text-lg font-mono font-extrabold text-indigo-900">{lanInfo.url}</p>
            <p className="text-xs text-indigo-500">Share this with others so they can join</p>
          </div>
        )}

        {mode === "host" && !lanInfo?.url && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 font-medium">
            Make sure the API server is running locally (npm run dev in /api).
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Join: server address */}
        {mode === "join" && (
          <div className="space-y-1.5">
            <Label htmlFor="host" className="text-xs font-bold text-slate-700">Host Address</Label>
            <Input
              id="host"
              type="text"
              placeholder="192.168.1.100:3000"
              value={hostIp}
              onChange={(e) => setHostIp(e.target.value)}
              className="rounded-xl font-mono"
            />
            <p className="text-[10px] text-slate-400">The address shown on the host&apos;s screen</p>
          </div>
        )}

        {/* Nickname */}
        <div className="space-y-1.5">
          <Label htmlFor="nickname" className="text-xs font-bold text-slate-700">Nickname</Label>
          <Input
            id="nickname"
            type="text"
            placeholder="Your display name"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoinAsGuest()}
            maxLength={20}
            className="rounded-xl"
          />
        </div>

        <Button
          onClick={handleJoinAsGuest}
          disabled={loading || !nickname.trim() || (mode === "join" && !hostIp.trim())}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            mode === "host" ? "Start Playing" : "Join Game"
          )}
        </Button>

        <button
          onClick={() => { setMode("choose"); setError(""); }}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </CardContent>
    </Card>
  );
}
