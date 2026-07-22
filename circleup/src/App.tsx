import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useRoomStore } from './store/useRoomStore';
import { useGameStore } from './store/useGameStore';
import { api } from './lib/api';
import { GameInfo } from './types';

// Layout components
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { BottomNav } from './components/layout/BottomNav';
import { FloatingAction } from './components/layout/FloatingAction';

// Feature Views
import { HomeDashboard } from './components/home/HomeDashboard';
import { FriendsView } from './components/friends/FriendsView';
import { GamesCatalogView } from './components/games/GamesCatalogView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { UserProfileView } from './components/profile/UserProfileView';
import { AdminView } from './components/admin/AdminView';
import { CircleRoomView } from './components/room/CircleRoomView';
import { GameScreenView } from './components/game/GameScreenView';

// Modals
import { CreateCircleModal } from './components/modals/CreateCircleModal';
import { AuthModal } from './components/modals/AuthModal';

export default function App() {
  const { user, isAuthenticated } = useAuthStore();
  const { currentRoom, leaveRoom, initSocketListeners } = useRoomStore();
  const { gameState, initGameListeners } = useGameStore();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [games, setGames] = useState<GameInfo[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load games list & init listeners
  const loadGames = async () => {
    try {
      const list = await api.games.list();
      setGames(list);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

  useEffect(() => {
    loadGames();
    initSocketListeners();
    initGameListeners();
  }, []);

  // Handle auto-switching to active game screen when game starts
  useEffect(() => {
    if (gameState && gameState.phase !== 'lobby') {
      setActiveTab('game_match');
    } else if (currentRoom && activeTab === 'game_match' && gameState?.phase === 'lobby') {
      setActiveTab('circle');
    }
  }, [gameState, currentRoom]);

  const handleCreateRoomClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row antialiased font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={handleCreateRoomClick}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateModal={handleCreateRoomClick}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'home' && (
            <HomeDashboard
              games={games}
              setActiveTab={setActiveTab}
              onOpenCreateModal={handleCreateRoomClick}
            />
          )}

          {activeTab === 'friends' && <FriendsView />}

          {activeTab === 'games' && (
            <GamesCatalogView
              games={games}
              onSelectGameToPlay={(game) => {
                handleCreateRoomClick();
              }}
            />
          )}

          {activeTab === 'notifications' && <NotificationsView setActiveTab={setActiveTab} />}

          {activeTab === 'profile' && <UserProfileView />}

          {activeTab === 'admin' && <AdminView games={games} onRefreshGames={loadGames} />}

          {activeTab === 'circle' && (
            <CircleRoomView
              games={games}
              onStartGame={() => {
                setActiveTab('game_match');
              }}
              onLeaveRoom={() => {
                leaveRoom();
                setActiveTab('home');
              }}
            />
          )}

          {activeTab === 'game_match' && <GameScreenView />}
        </main>

        {/* Mobile Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <FloatingAction onClick={handleCreateRoomClick} />
      </div>

      {/* Global Modals */}
      <CreateCircleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        games={games}
        user={user}
        onSuccess={(roomCode) => {
          setActiveTab('circle');
        }}
      />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
