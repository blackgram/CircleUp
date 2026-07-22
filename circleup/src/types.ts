/**
 * CircleUp Core Type Definitions
 * Gather. Play. Connect. by AJ
 */

export type UserRole = 'user' | 'admin';
export type UserStatus = 'online' | 'in_game' | 'idle' | 'offline';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number; // e.g. 68 (%)
  currentStreak: number;
  favoriteGame: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  nickname?: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
  stats: UserStats;
  createdAt: string;
}

export type FriendStatus = 'accepted' | 'pending_sent' | 'pending_received';

export interface Friend {
  id: string;
  user: User;
  status: FriendStatus;
  createdAt: string;
}

export type NotificationType = 'invite' | 'friend_request' | 'system' | 'achievement';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: {
    roomCode?: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    actionUrl?: string;
  };
  read: boolean;
  createdAt: string;
}

export interface GameSchemaField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'range';
  default: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface QuestionSchemaField {
  key: string;
  label: string;
  type: 'text' | 'options' | 'image' | 'code' | 'player_select';
  required: boolean;
}

export interface GameInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Emoji or Lucide icon key
  minPlayers: number;
  maxPlayers: number;
  estimatedTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  enabled: boolean;
  settingsSchema: GameSchemaField[];
  questionSchema: QuestionSchemaField[];
  defaultSettings: Record<string, any>;
  bannerGradient?: string;
}

export interface RoomPlayer {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
  connectionStatus: 'online' | 'reconnecting' | 'offline';
  score: number;
  streak: number;
  joinedAt: string;
}

export type RoomStatus = 'lobby' | 'playing' | 'ended';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'chat' | 'system' | 'reaction';
  timestamp: string;
}

export interface Room {
  code: string;
  name: string;
  hostId: string;
  gameId: string;
  status: RoomStatus;
  players: RoomPlayer[];
  settings: Record<string, any>;
  maxPlayers: number;
  isPrivate: boolean;
  chatMessages: ChatMessage[];
  createdAt: string;
}

export type GamePhase =
  | 'lobby'
  | 'countdown'
  | 'question'
  | 'answering'
  | 'voting'
  | 'reveal'
  | 'round_summary'
  | 'game_over';

export interface QuestionOption {
  id: string;
  text: string;
  icon?: string;
}

export interface Question {
  id: string;
  prompt: string;
  codeSnippet?: string;
  imageUrl?: string;
  options?: QuestionOption[];
  type: 'multiple_choice' | 'text_guess' | 'player_vote' | 'speed_tap';
  metadata?: Record<string, any>;
}

export interface PlayerAnswer {
  answer: any;
  timeTaken: number; // in seconds
  scoreEarned: number;
  isCorrect?: boolean;
}

export interface RoundResult {
  correctAnswerId?: string;
  correctAnswerText?: string;
  explanation?: string;
  breakdown?: Record<string, number>; // optionId or text -> count
  topScorersThisRound?: { userId: string; score: number }[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string;
  score: number;
  rank: number;
  streak: number;
  lastScoreChange: number;
}

export interface GameState {
  roomId: string;
  gameId: string;
  currentRound: number;
  totalRounds: number;
  phase: GamePhase;
  phaseTimeRemaining: number; // Seconds left
  phaseTotalTime: number; // Total seconds allocated for this phase
  currentQuestion?: Question;
  playerAnswers: Record<string, PlayerAnswer>;
  roundResult?: RoundResult;
  scores: Record<string, number>;
  leaderboard: LeaderboardEntry[];
  winner?: {
    userId: string;
    displayName: string;
    avatarUrl: string;
    score: number;
  };
}

export interface PlatformAnalytics {
  activeCirclesCount: number;
  totalUsersCount: number;
  onlineUsersCount: number;
  gamesPlayedToday: number;
  popularGameName: string;
}
