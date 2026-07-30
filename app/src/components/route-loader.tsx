"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

export function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hide loader when route actually changes
  useEffect(() => {
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [pathname, searchParams]);

  // Intercept link clicks to show loader (only real navigations)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Wait a tick to see if preventDefault was called
      setTimeout(() => {
        if (e.defaultPrevented) return;
        const anchor = (e.target as HTMLElement).closest("a");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;
        setLoading(true);
        // Safety timeout — hide after 4s if route never changed
        timeoutRef.current = setTimeout(() => setLoading(false), 4000);
      }, 0);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-pulse">
          <Image src="/logo.png" alt="Loading" width={48} height={48} className="animate-spin-slow" />
        </div>
        <p className="text-xs font-bold text-slate-500 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
