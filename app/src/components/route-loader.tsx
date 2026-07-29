"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

export function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [prevPath, setPrevPath] = useState("");

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (prevPath && prevPath !== currentPath) {
      // Route changed — hide loader
      setLoading(false);
    }
    setPrevPath(currentPath);
  }, [pathname, searchParams]);

  // Intercept link clicks to show loader
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;
      // Internal navigation — show loader
      setLoading(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // Also intercept programmatic navigation (router.push)
  useEffect(() => {
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function (...args) {
      setLoading(true);
      return originalPushState(...args);
    };

    history.replaceState = function (...args) {
      setLoading(true);
      return originalReplaceState(...args);
    };

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

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
