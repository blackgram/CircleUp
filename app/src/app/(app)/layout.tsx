"use client";

import { useAuthStore } from "@/stores/auth";
import { useUIStore } from "@/stores/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { connectSocket, disconnectSocket } from "@/lib/socket/client";
import { AuthModal } from "@/components/auth-modal";
import { Home, Users, Gamepad2, Bell, User, ShieldCheck, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/friends", label: "Friends", icon: Users, auth: true },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/notifications", label: "Notifications", icon: Bell, auth: true },
  { href: "/profile", label: "Profile", icon: User, auth: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      connectSocket();
    }
    return () => {
      if (!user) disconnectSocket();
    };
  }, [user]);

  function handleNavClick(e: React.MouseEvent, item: typeof navItems[0]) {
    if (item.auth && !isAuthenticated()) {
      e.preventDefault();
      openAuthModal();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row antialiased font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center px-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="CircleUp" width={28} height={28} />
            <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">CircleUp</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}

          {mounted && isAdmin() && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-200 p-4">
          {mounted && user ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                  {user.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">@{user.nickname}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); router.push("/dashboard"); }}
                className="mt-3 flex items-center gap-2 text-xs text-slate-500 hover:text-rose-600 transition-colors font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="w-full text-sm font-bold text-indigo-600 hover:text-indigo-700 py-2"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto min-h-screen">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="CircleUp" width={24} height={24} />
            <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">CircleUp</span>
          </Link>
          {mounted && user ? (
            <button
              onClick={() => router.push("/profile")}
              className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white"
            >
              {user.displayName[0]?.toUpperCase()}
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="text-sm font-bold text-indigo-600"
            >
              Sign In
            </button>
          )}
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around z-50">
        {navItems.slice(0, 5).map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-semibold ${
                active ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
}
