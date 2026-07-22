import React from 'react';
import { Home, Users, Gamepad2, Bell, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute top-0.5 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
