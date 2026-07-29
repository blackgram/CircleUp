/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { ApiResponse, AuthResponse } from "@/types";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function AuthModal() {
  const { authModalOpen, closeAuthModal } = useUIStore();
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", nickname: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Nickname prompt state
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function reset() {
    setForm({ email: "", password: "", nickname: "", displayName: "" });
    setError("");
    setMode("login");
    setShowEmailForm(false);
    setGoogleLoading(false);
    setShowNicknamePrompt(false);
    setNicknameInput("");
  }

  function handleClose() {
    reset();
    closeAuthModal();
  }

  function handleGoogleClick() {
    if (!(window as any).google || !GOOGLE_CLIENT_ID) {
      setError("Google Sign-In is not available");
      return;
    }

    setGoogleLoading(true);
    setError("");

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: async (response: any) => {
        if (response.error) {
          setGoogleLoading(false);
          setError("Google sign-in was cancelled");
          return;
        }

        try {
          const { data } = await api.post<ApiResponse<AuthResponse & { isNewUser?: boolean }>>("/api/auth/google", {
            accessToken: response.access_token,
          });
          if (data.success && data.data) {
            setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);

            // If new user, show nickname prompt
            if (data.data.isNewUser) {
              setNicknameInput(data.data.user.nickname);
              setShowNicknamePrompt(true);
              setGoogleLoading(false);
            } else {
              handleClose();
              router.refresh();
            }
          } else {
            setError(data.message || "Google sign-in failed");
            setGoogleLoading(false);
          }
        } catch (err: any) {
          setError(err.response?.data?.message || "Google sign-in failed");
          setGoogleLoading(false);
        }
      },
      error_callback: () => {
        setGoogleLoading(false);
        setError("Google sign-in popup was closed");
      },
    });

    tokenClient.requestAccessToken();
  }

  async function handleSaveNickname() {
    if (!nicknameInput.trim()) return;
    setSavingNickname(true);
    try {
      const { data } = await api.patch<ApiResponse<any>>("/api/users/me", {
        nickname: nicknameInput.trim(),
      });
      if (data.success && data.data) {
        // Update stored user with new nickname
        const currentAuth = useAuthStore.getState();
        if (currentAuth.user) {
          setAuth({ ...currentAuth.user, nickname: nicknameInput.trim() }, currentAuth.accessToken!, currentAuth.refreshToken!);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to set nickname");
      setSavingNickname(false);
      return;
    }
    setSavingNickname(false);
    handleClose();
    router.refresh();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : form;

      const { data } = await api.post<ApiResponse<AuthResponse>>(endpoint, payload);
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
        handleClose();
        router.refresh();
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
      />
      <Dialog open={authModalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg font-extrabold">
              <Image src="/logo.png" alt="CircleUp" width={24} height={24} />
              Welcome to CircleUp
            </DialogTitle>
          </DialogHeader>
          <p className="text-indigo-100 text-sm mt-1">
            Sign in to create circles and play with friends.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Nickname Prompt (for new Google users) */}
          {showNicknamePrompt ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">Choose your nickname</p>
                <p className="text-xs text-slate-500 mt-1">This is how other players will see you in games.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nickname-prompt" className="text-xs font-bold text-slate-700">Nickname</Label>
                <Input
                  id="nickname-prompt"
                  placeholder="your_nickname"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="rounded-xl"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()}
                />
              </div>
              <Button
                onClick={handleSaveNickname}
                disabled={!nicknameInput.trim() || savingNickname}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5"
              >
                {savingNickname ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {savingNickname ? "Saving..." : "Let's Go!"}
              </Button>
              <button
                onClick={() => { handleClose(); router.refresh(); }}
                className="w-full text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                Skip for now
              </button>
            </div>
          ) : (
            <>
              {/* Google Sign In — Primary */}
              <button
                onClick={handleGoogleClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-sm py-3 rounded-xl text-slate-700 transition-all shadow-sm disabled:opacity-70"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {googleLoading ? "Signing in..." : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500 font-medium">or</span>
                </div>
              </div>

              {/* Email/Password — Secondary (collapsible) */}
              <button
                type="button"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 py-2 transition-colors"
              >
                {showEmailForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showEmailForm ? "Hide" : "Continue with email"}
              </button>

              {showEmailForm && (
                <div className="space-y-4 pt-2">
                  {/* Mode Switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); }}
                      className={`flex-1 py-2.5 rounded-lg transition-all ${
                        mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setError(""); }}
                      className={`flex-1 py-2.5 rounded-lg transition-all ${
                        mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    {mode === "register" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="auth-displayName" className="text-xs font-bold text-slate-700">Display Name</Label>
                          <Input
                            id="auth-displayName"
                            placeholder="AJ"
                            value={form.displayName}
                            onChange={(e) => updateField("displayName", e.target.value)}
                            required
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="auth-nickname" className="text-xs font-bold text-slate-700">Nickname</Label>
                          <Input
                            id="auth-nickname"
                            placeholder="aj_games"
                            value={form.nickname}
                            onChange={(e) => updateField("nickname", e.target.value)}
                            required
                            className="rounded-xl"
                          />
                        </div>
                      </>
                    )}

                <div className="space-y-1.5">
                  <Label htmlFor="auth-email" className="text-xs font-bold text-slate-700">Email</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auth-password" className="text-xs font-bold text-slate-700">Password</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 mt-2"
                >
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </div>
          )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
