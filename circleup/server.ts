import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  User,
  GameInfo,
  Room,
  RoomPlayer,
  GameState,
  ChatMessage,
  Friend,
  Notification,
  PlatformAnalytics,
} from './src/types.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO server setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// In-Memory Database / State for CircleUp
const INITIAL_USER: User = {
  id: 'usr_me',
  email: 'alex@circleup.app',
  displayName: 'Alex Rivers',
  nickname: 'PixelMaster',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'admin',
  status: 'online',
  stats: {
    gamesPlayed: 42,
    gamesWon: 27,
    winRate: 64,
    currentStreak: 5,
    favoriteGame: 'Trivia Master',
  },
  createdAt: new Date().toISOString(),
};

const SAMPLE_FRIENDS: Friend[] = [
  {
    id: 'f_1',
    user: {
      id: 'usr_sara',
      email: 'sara@circleup.app',
      displayName: 'Sara Connor',
      nickname: 'CyberSara',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      status: 'online',
      stats: { gamesPlayed: 30, gamesWon: 18, winRate: 60, currentStreak: 3, favoriteGame: 'Trivia Master' },
      createdAt: new Date().toISOString(),
    },
    status: 'accepted',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f_2',
    user: {
      id: 'usr_marcus',
      email: 'marcus@circleup.app',
      displayName: 'Marcus Vance',
      nickname: 'VanceX',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      status: 'in_game',
      stats: { gamesPlayed: 55, gamesWon: 32, winRate: 58, currentStreak: 2, favoriteGame: 'Most Likely To...' },
      createdAt: new Date().toISOString(),
    },
    status: 'accepted',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f_3',
    user: {
      id: 'usr_luna',
      email: 'luna@circleup.app',
      displayName: 'Luna Star',
      nickname: 'StarGazer',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      status: 'online',
      stats: { gamesPlayed: 22, gamesWon: 14, winRate: 63, currentStreak: 4, favoriteGame: 'Word Blitz' },
      createdAt: new Date().toISOString(),
    },
    status: 'accepted',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f_4',
    user: {
      id: 'usr_kai',
      email: 'kai@circleup.app',
      displayName: 'Kai Zen',
      nickname: 'ZenMaster',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      status: 'offline',
      stats: { gamesPlayed: 12, gamesWon: 4, winRate: 33, currentStreak: 0, favoriteGame: 'Speed Pick' },
      createdAt: new Date().toISOString(),
    },
    status: 'pending_received',
    createdAt: new Date().toISOString(),
  },
];

const GAMES_CATALOG: GameInfo[] = [
  {
    id: 'game_trivia',
    name: 'Trivia Master',
    slug: 'trivia-master',
    description: 'Test your knowledge across pop culture, science, tech, and history in fast-paced multiple choice rounds.',
    icon: 'Brain',
    minPlayers: 1,
    maxPlayers: 12,
    estimatedTimeMinutes: 8,
    difficulty: 'Medium',
    category: 'Knowledge',
    enabled: true,
    bannerGradient: 'from-indigo-600 via-purple-600 to-pink-500',
    defaultSettings: {
      rounds: 5,
      timePerQuestion: 15,
      category: 'General Knowledge',
      pointsPerCorrect: 1000,
    },
    settingsSchema: [
      { key: 'rounds', label: 'Rounds', type: 'range', default: 5, min: 3, max: 10, step: 1, description: 'Number of questions per match' },
      { key: 'timePerQuestion', label: 'Seconds per Question', type: 'range', default: 15, min: 10, max: 30, step: 5, description: 'Time allowed per turn' },
      { key: 'category', label: 'Topic Category', type: 'select', default: 'General Knowledge', options: [{ label: 'General Knowledge', value: 'General Knowledge' }, { label: 'Pop Culture & Movies', value: 'Pop Culture' }, { label: 'Tech & Code', value: 'Tech' }, { label: 'World History', value: 'History' }] },
    ],
    questionSchema: [
      { key: 'prompt', label: 'Question Text', type: 'text', required: true },
      { key: 'options', label: 'Choice Options', type: 'options', required: true },
      { key: 'codeSnippet', label: 'Code Snippet (Optional)', type: 'code', required: false },
      { key: 'imageUrl', label: 'Image Attachment (Optional)', type: 'image', required: false },
    ],
  },
  {
    id: 'game_vote',
    name: 'Most Likely To...',
    slug: 'most-likely-to',
    description: 'Vote on which friend in your circle is most likely to do hilarious, crazy, or genius things.',
    icon: 'Users',
    minPlayers: 2,
    maxPlayers: 16,
    estimatedTimeMinutes: 10,
    difficulty: 'Easy',
    category: 'Social',
    enabled: true,
    bannerGradient: 'from-violet-600 via-indigo-600 to-cyan-500',
    defaultSettings: {
      rounds: 5,
      timePerQuestion: 20,
      anonymousVoting: false,
    },
    settingsSchema: [
      { key: 'rounds', label: 'Rounds', type: 'range', default: 5, min: 3, max: 10, step: 1, description: 'Number of prompts' },
      { key: 'timePerQuestion', label: 'Voting Timer (s)', type: 'range', default: 20, min: 10, max: 40, step: 5 },
      { key: 'anonymousVoting', label: 'Anonymous Votes', type: 'boolean', default: false, description: 'Hide who voted for whom during reveal' },
    ],
    questionSchema: [
      { key: 'prompt', label: 'Scenario Prompt', type: 'text', required: true },
      { key: 'playerOptions', label: 'Eligible Players', type: 'player_select', required: true },
    ],
  },
  {
    id: 'game_word',
    name: 'Word Blitz',
    slug: 'word-blitz',
    description: 'Unscramble clues and solve fast word puzzles before time runs out to earn double bonus points!',
    icon: 'Zap',
    minPlayers: 1,
    maxPlayers: 8,
    estimatedTimeMinutes: 6,
    difficulty: 'Hard',
    category: 'Word & Puzzle',
    enabled: true,
    bannerGradient: 'from-cyan-500 via-teal-600 to-emerald-600',
    defaultSettings: {
      rounds: 5,
      timePerQuestion: 18,
      allowHints: true,
    },
    settingsSchema: [
      { key: 'rounds', label: 'Total Puzzles', type: 'range', default: 5, min: 3, max: 8, step: 1 },
      { key: 'timePerQuestion', label: 'Timer per Word (s)', type: 'range', default: 18, min: 10, max: 30, step: 2 },
      { key: 'allowHints', label: 'Reveal Letter Hints', type: 'boolean', default: true },
    ],
    questionSchema: [
      { key: 'prompt', label: 'Clue Hint', type: 'text', required: true },
      { key: 'targetWord', label: 'Target Word', type: 'text', required: true },
    ],
  },
  {
    id: 'game_speed',
    name: 'Speed Pick',
    slug: 'speed-pick',
    description: 'Rapid-fire reaction challenge! Tap the matching pattern, highest number, or correct color instantly.',
    icon: 'Flame',
    minPlayers: 1,
    maxPlayers: 10,
    estimatedTimeMinutes: 5,
    difficulty: 'Easy',
    category: 'Reaction',
    enabled: true,
    bannerGradient: 'from-rose-500 via-orange-500 to-amber-500',
    defaultSettings: {
      rounds: 6,
      timePerQuestion: 8,
    },
    settingsSchema: [
      { key: 'rounds', label: 'Rounds', type: 'range', default: 6, min: 4, max: 12, step: 1 },
      { key: 'timePerQuestion', label: 'Reaction Window (s)', type: 'range', default: 8, min: 4, max: 12, step: 1 },
    ],
    questionSchema: [
      { key: 'prompt', label: 'Target Rule', type: 'text', required: true },
      { key: 'options', label: 'Quick Options', type: 'options', required: true },
    ],
  },
];

// Sample Questions Bank for dynamically generating game rounds
const QUESTIONS_BANK: Record<string, any[]> = {
  game_trivia: [
    {
      id: 'q_t1',
      prompt: 'Which programming language was created by Brendan Eich in just 10 days in 1995?',
      options: [
        { id: 'opt_1', text: 'JavaScript' },
        { id: 'opt_2', text: 'Python' },
        { id: 'opt_3', text: 'Java' },
        { id: 'opt_4', text: 'Ruby' },
      ],
      correctAnswerId: 'opt_1',
      explanation: 'Brendan Eich designed JavaScript in May 1995 while working at Netscape Communications.',
      type: 'multiple_choice',
    },
    {
      id: 'q_t2',
      prompt: 'What will the following TypeScript snippet output?',
      codeSnippet: `const numbers = [1, 2, 3];\nconst [x, ...rest] = numbers;\nconsole.log(rest);`,
      options: [
        { id: 'opt_1', text: '[1]' },
        { id: 'opt_2', text: '[2, 3]' },
        { id: 'opt_3', text: '3' },
        { id: 'opt_4', text: 'undefined' },
      ],
      correctAnswerId: 'opt_2',
      explanation: 'Array destructuring with rest operator captures remaining elements [2, 3].',
      type: 'multiple_choice',
    },
    {
      id: 'q_t3',
      prompt: 'Which planet in our solar system has the most moons discovered so far?',
      options: [
        { id: 'opt_1', text: 'Jupiter' },
        { id: 'opt_2', text: 'Saturn' },
        { id: 'opt_3', text: 'Uranus' },
        { id: 'opt_4', text: 'Neptune' },
      ],
      correctAnswerId: 'opt_2',
      explanation: 'Saturn leads with over 140 officially recognized moons.',
      type: 'multiple_choice',
    },
    {
      id: 'q_t4',
      prompt: 'What does CSS flexbox layout property "justify-content: space-between" do?',
      options: [
        { id: 'opt_1', text: 'Centers all items in container' },
        { id: 'opt_2', text: 'Distributes items evenly; first item at start, last at end' },
        { id: 'opt_3', text: 'Adds equal margin around every item' },
        { id: 'opt_4', text: 'Aligns items vertically' },
      ],
      correctAnswerId: 'opt_2',
      explanation: 'space-between places the first item at start line and last item at end line.',
      type: 'multiple_choice',
    },
    {
      id: 'q_t5',
      prompt: 'Who won the FIFA World Cup in 2022 held in Qatar?',
      options: [
        { id: 'opt_1', text: 'France' },
        { id: 'opt_2', text: 'Argentina' },
        { id: 'opt_3', text: 'Brazil' },
        { id: 'opt_4', text: 'Croatia' },
      ],
      correctAnswerId: 'opt_2',
      explanation: 'Argentina won after a thrilling penalty shootout against France.',
      type: 'multiple_choice',
    },
  ],
  game_vote: [
    {
      id: 'q_v1',
      prompt: 'Who is most likely to accidentally stay up until 4 AM coding a side project?',
      type: 'player_vote',
    },
    {
      id: 'q_v2',
      prompt: 'Who is most likely to survive a zombie apocalypse purely on luck?',
      type: 'player_vote',
    },
    {
      id: 'q_v3',
      prompt: 'Who is most likely to order delivery food three times in a single day?',
      type: 'player_vote',
    },
    {
      id: 'q_v4',
      prompt: 'Who is most likely to become a viral meme overnight?',
      type: 'player_vote',
    },
  ],
  game_word: [
    {
      id: 'q_w1',
      prompt: 'Unscramble this web development term: "ETCAR"',
      correctAnswerText: 'REACT',
      explanation: 'React is a popular component-based UI library created by Meta.',
      type: 'text_guess',
    },
    {
      id: 'q_w2',
      prompt: 'Unscramble this fast messaging concept: "OTSKEC"',
      correctAnswerText: 'SOCKET',
      explanation: 'Socket connection enables real-time bidirectional messaging.',
      type: 'text_guess',
    },
    {
      id: 'q_w3',
      prompt: 'Unscramble this gaming term: "YBLOB"',
      correctAnswerText: 'LOBBY',
      explanation: 'A lobby is where players gather before a game match starts.',
      type: 'text_guess',
    },
  ],
  game_speed: [
    {
      id: 'q_s1',
      prompt: 'TAP THE HIGHEST NUMBER AS FAST AS YOU CAN!',
      options: [
        { id: 'opt_1', text: '87' },
        { id: 'opt_2', text: '142' },
        { id: 'opt_3', text: '99' },
        { id: 'opt_4', text: '139' },
      ],
      correctAnswerId: 'opt_2',
      type: 'multiple_choice',
    },
    {
      id: 'q_s2',
      prompt: 'SELECT THE CYAN COLORED CARD INSTANTLY!',
      options: [
        { id: 'opt_1', text: 'Indigo 🔮' },
        { id: 'opt_2', text: 'Cyan ⚡' },
        { id: 'opt_3', text: 'Violet 💜' },
        { id: 'opt_4', text: 'Emerald 🟢' },
      ],
      correctAnswerId: 'opt_2',
      type: 'multiple_choice',
    },
  ],
};

// Rooms storage
const roomsStore = new Map<string, Room>();
const gameStatesStore = new Map<string, GameState>();
const notificationsStore: Notification[] = [
  {
    id: 'notif_1',
    userId: 'usr_me',
    title: 'Circle Invite',
    message: 'Sara Connor invited you to join Circle CIR-789!',
    type: 'invite',
    data: { roomCode: 'CIR-789', senderName: 'Sara Connor', senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'notif_2',
    userId: 'usr_me',
    title: 'Friend Request',
    message: 'Kai Zen sent you a friend request.',
    type: 'friend_request',
    data: { senderId: 'usr_kai', senderName: 'Kai Zen' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'notif_3',
    userId: 'usr_me',
    title: 'Achievement Unlocked',
    message: '🎉 Win Streak Master! You achieved a 5-game winning streak.',
    type: 'achievement',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

// Pre-populate a demo room so users see active activity immediately
const DEMO_ROOM_CODE = 'CIR-789';
roomsStore.set(DEMO_ROOM_CODE, {
  code: DEMO_ROOM_CODE,
  name: "Sara's Friday Game Night",
  hostId: 'usr_sara',
  gameId: 'game_trivia',
  status: 'lobby',
  players: [
    {
      userId: 'usr_sara',
      displayName: 'Sara Connor',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isHost: true,
      isReady: true,
      connectionStatus: 'online',
      score: 0,
      streak: 0,
      joinedAt: new Date().toISOString(),
    },
    {
      userId: 'usr_marcus',
      displayName: 'Marcus Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isHost: false,
      isReady: true,
      connectionStatus: 'online',
      score: 0,
      streak: 0,
      joinedAt: new Date().toISOString(),
    },
  ],
  settings: {
    rounds: 5,
    timePerQuestion: 15,
    category: 'General Knowledge',
  },
  maxPlayers: 8,
  isPrivate: false,
  chatMessages: [
    {
      id: 'msg_1',
      senderId: 'usr_sara',
      senderName: 'Sara Connor',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'Welcome everyone! Get ready for Trivia Master 🚀',
      type: 'chat',
      timestamp: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
});

// Helper functions for room and game management
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'CIR-';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// REST API Endpoints

// Auth REST API
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = { ...INITIAL_USER, email: email || INITIAL_USER.email };
  res.json({ success: true, user, token: 'mock_jwt_token_123' });
});

app.post('/api/auth/register', (req, res) => {
  const { displayName, email } = req.body;
  const user: User = {
    ...INITIAL_USER,
    id: `usr_${Date.now()}`,
    displayName: displayName || 'New Player',
    email: email || 'user@circleup.app',
  };
  res.json({ success: true, user, token: 'mock_jwt_token_123' });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: INITIAL_USER });
});

// Games REST API
app.get('/api/games', (req, res) => {
  res.json(GAMES_CATALOG.filter((g) => g.enabled));
});

app.get('/api/games/all', (req, res) => {
  res.json(GAMES_CATALOG);
});

app.get('/api/games/:id', (req, res) => {
  const game = GAMES_CATALOG.find((g) => g.id === req.params.id || g.slug === req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

app.post('/api/admin/games', (req, res) => {
  const newGame: GameInfo = {
    id: `game_${Date.now()}`,
    name: req.body.name || 'Custom Party Game',
    slug: (req.body.name || 'custom-game').toLowerCase().replace(/\s+/g, '-'),
    description: req.body.description || 'Custom user generated game',
    icon: req.body.icon || 'Sparkles',
    minPlayers: req.body.minPlayers || 2,
    maxPlayers: req.body.maxPlayers || 12,
    estimatedTimeMinutes: req.body.estimatedTimeMinutes || 10,
    difficulty: req.body.difficulty || 'Medium',
    category: req.body.category || 'Custom',
    enabled: true,
    settingsSchema: req.body.settingsSchema || [],
    questionSchema: req.body.questionSchema || [],
    defaultSettings: req.body.defaultSettings || {},
    bannerGradient: 'from-purple-600 via-indigo-600 to-blue-500',
  };
  GAMES_CATALOG.push(newGame);
  res.json(newGame);
});

app.patch('/api/admin/games/:id', (req, res) => {
  const game = GAMES_CATALOG.find((g) => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  if (typeof req.body.enabled === 'boolean') {
    game.enabled = req.body.enabled;
  }
  if (req.body.name) game.name = req.body.name;
  if (req.body.description) game.description = req.body.description;
  if (req.body.defaultSettings) game.defaultSettings = req.body.defaultSettings;

  res.json(game);
});

// Rooms REST API
app.post('/api/rooms', (req, res) => {
  const { name, gameId, maxPlayers, isPrivate, settings, hostUser } = req.body;
  const game = GAMES_CATALOG.find((g) => g.id === gameId) || GAMES_CATALOG[0];

  const host: RoomPlayer = {
    userId: hostUser?.id || INITIAL_USER.id,
    displayName: hostUser?.displayName || INITIAL_USER.displayName,
    avatarUrl: hostUser?.avatarUrl || INITIAL_USER.avatarUrl,
    isHost: true,
    isReady: true,
    connectionStatus: 'online',
    score: 0,
    streak: 0,
    joinedAt: new Date().toISOString(),
  };

  const code = generateRoomCode();
  const room: Room = {
    code,
    name: name || `${host.displayName}'s Circle`,
    hostId: host.userId,
    gameId: game.id,
    status: 'lobby',
    players: [host],
    settings: settings || game.defaultSettings,
    maxPlayers: maxPlayers || game.maxPlayers,
    isPrivate: Boolean(isPrivate),
    chatMessages: [
      {
        id: `msg_${Date.now()}`,
        senderId: 'system',
        senderName: 'CircleUp',
        content: `Circle created! Room Code: ${code}`,
        type: 'system',
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  roomsStore.set(code, room);
  res.json(room);
});

app.get('/api/rooms', (req, res) => {
  const activeRooms = Array.from(roomsStore.values());
  res.json(activeRooms);
});

app.get('/api/rooms/:code', (req, res) => {
  const room = roomsStore.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

app.post('/api/rooms/join', (req, res) => {
  const { code, user } = req.body;
  const room = roomsStore.get((code || '').toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room code not found' });

  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const existingPlayer = room.players.find((p) => p.userId === user.id);
  if (!existingPlayer) {
    const newPlayer: RoomPlayer = {
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isHost: false,
      isReady: false,
      connectionStatus: 'online',
      score: 0,
      streak: 0,
      joinedAt: new Date().toISOString(),
    };
    room.players.push(newPlayer);
    room.chatMessages.push({
      id: `msg_${Date.now()}`,
      senderId: 'system',
      senderName: 'CircleUp',
      content: `${user.displayName} joined the Circle!`,
      type: 'system',
      timestamp: new Date().toISOString(),
    });

    io.to(`room:${room.code}`).emit('room:update', room);
  }

  res.json(room);
});

// Friends REST API
app.get('/api/friends', (req, res) => {
  res.json(SAMPLE_FRIENDS);
});

app.post('/api/friends/request', (req, res) => {
  const { targetEmailOrUsername } = req.body;
  res.json({ success: true, message: `Friend request sent to ${targetEmailOrUsername}` });
});

app.post('/api/friends/accept', (req, res) => {
  const { friendId } = req.body;
  const friend = SAMPLE_FRIENDS.find((f) => f.id === friendId);
  if (friend) friend.status = 'accepted';
  res.json({ success: true, friends: SAMPLE_FRIENDS });
});

// Notifications REST API
app.get('/api/notifications', (req, res) => {
  res.json(notificationsStore);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const notif = notificationsStore.find((n) => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  notificationsStore.forEach((n) => (n.read = true));
  res.json({ success: true });
});

app.delete('/api/notifications/clear', (req, res) => {
  notificationsStore.length = 0;
  res.json({ success: true });
});

// Admin Analytics
app.get('/api/admin/analytics', (req, res) => {
  const analytics: PlatformAnalytics = {
    activeCirclesCount: roomsStore.size,
    totalUsersCount: 1240,
    onlineUsersCount: 38,
    gamesPlayedToday: 184,
    popularGameName: 'Trivia Master',
  };
  res.json(analytics);
});

app.get('/api/admin/users', (req, res) => {
  res.json([
    INITIAL_USER,
    ...SAMPLE_FRIENDS.map((f) => f.user),
  ]);
});

// Real-Time Socket.IO Game Engine Loops
const gameTimerIntervals = new Map<string, NodeJS.Timeout>();

function startGameStateLoop(roomCode: string) {
  const room = roomsStore.get(roomCode);
  if (!room) return;

  const gameInfo = GAMES_CATALOG.find((g) => g.id === room.gameId) || GAMES_CATALOG[0];
  const questions = QUESTIONS_BANK[room.gameId] || QUESTIONS_BANK['game_trivia'];

  let gameState: GameState = {
    roomId: roomCode,
    gameId: room.gameId,
    currentRound: 1,
    totalRounds: room.settings.rounds || 5,
    phase: 'countdown',
    phaseTimeRemaining: 3,
    phaseTotalTime: 3,
    currentQuestion: undefined,
    playerAnswers: {},
    scores: {},
    leaderboard: room.players.map((p, idx) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      score: 0,
      rank: idx + 1,
      streak: 0,
      lastScoreChange: 0,
    })),
  };

  room.players.forEach((p) => {
    gameState.scores[p.userId] = 0;
  });

  gameStatesStore.set(roomCode, gameState);
  room.status = 'playing';
  io.to(`room:${roomCode}`).emit('room:update', room);
  io.to(`room:${roomCode}`).emit('game:update', gameState);

  if (gameTimerIntervals.has(roomCode)) {
    clearInterval(gameTimerIntervals.get(roomCode));
  }

  const interval = setInterval(() => {
    const currentState = gameStatesStore.get(roomCode);
    if (!currentState) {
      clearInterval(interval);
      return;
    }

    if (currentState.phaseTimeRemaining > 0) {
      currentState.phaseTimeRemaining -= 1;
      io.to(`room:${roomCode}`).emit('game:update', currentState);
      return;
    }

    // Phase State Machine Transition
    switch (currentState.phase) {
      case 'countdown': {
        // Transition to question
        currentState.phase = 'question';
        const qIndex = (currentState.currentRound - 1) % questions.length;
        const qData = questions[qIndex];

        // For player_vote type, attach player options
        let options = qData.options;
        if (qData.type === 'player_vote') {
          options = room.players.map((p) => ({
            id: p.userId,
            text: p.displayName,
            icon: p.avatarUrl,
          }));
        }

        currentState.currentQuestion = {
          ...qData,
          options,
        };
        currentState.playerAnswers = {};
        currentState.roundResult = undefined;
        const timeLimit = room.settings.timePerQuestion || 15;
        currentState.phaseTimeRemaining = timeLimit;
        currentState.phaseTotalTime = timeLimit;
        break;
      }

      case 'question': {
        // Time expired for question -> calculate answers & reveal
        currentState.phase = 'reveal';
        currentState.phaseTimeRemaining = 5;
        currentState.phaseTotalTime = 5;

        // Process answers & update scores
        const q = currentState.currentQuestion;
        const answers = currentState.playerAnswers;
        const roundScores: Record<string, number> = {};

        // Bot answer auto-fill if players didn't answer
        room.players.forEach((p) => {
          if (!answers[p.userId]) {
            if (q?.options && q.options.length > 0) {
              const randomOpt = q.options[Math.floor(Math.random() * q.options.length)];
              answers[p.userId] = {
                answer: randomOpt.id,
                timeTaken: Math.floor(Math.random() * 5) + 3,
                scoreEarned: 0,
                isCorrect: false,
              };
            }
          }
        });

        // Calculate score additions
        let correctAnswerId = (q as any)?.correctAnswerId;
        let correctAnswerText = (q as any)?.correctAnswerText;

        room.players.forEach((p) => {
          const userAns = answers[p.userId];
          if (!userAns) return;

          let earned = 0;
          let isCorrect = false;

          if (q?.type === 'multiple_choice') {
            if (userAns.answer === correctAnswerId) {
              isCorrect = true;
              const speedBonus = Math.max(200, 1000 - userAns.timeTaken * 50);
              earned = speedBonus;
            }
          } else if (q?.type === 'text_guess') {
            if (
              String(userAns.answer).trim().toUpperCase() ===
              String(correctAnswerText).trim().toUpperCase()
            ) {
              isCorrect = true;
              earned = 1200;
            }
          } else if (q?.type === 'player_vote') {
            isCorrect = true;
            earned = 500;
          }

          userAns.scoreEarned = earned;
          userAns.isCorrect = isCorrect;
          currentState.scores[p.userId] = (currentState.scores[p.userId] || 0) + earned;
          roundScores[p.userId] = earned;
        });

        // Vote breakdown if applicable
        const breakdown: Record<string, number> = {};
        Object.values(answers).forEach((ans) => {
          const key = String(ans.answer);
          breakdown[key] = (breakdown[key] || 0) + 1;
        });

        currentState.roundResult = {
          correctAnswerId,
          correctAnswerText,
          explanation: (q as any)?.explanation,
          breakdown,
          topScorersThisRound: Object.entries(roundScores).map(([uId, sc]) => ({ userId: uId, score: sc })),
        };

        // Update leaderboard
        const sortedPlayers = [...room.players].sort(
          (a, b) => (currentState.scores[b.userId] || 0) - (currentState.scores[a.userId] || 0)
        );

        currentState.leaderboard = sortedPlayers.map((p, rankIdx) => ({
          userId: p.userId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          score: currentState.scores[p.userId] || 0,
          rank: rankIdx + 1,
          streak: roundScores[p.userId] ? 1 : 0,
          lastScoreChange: roundScores[p.userId] || 0,
        }));

        break;
      }

      case 'reveal': {
        // Move to next round or game over
        if (currentState.currentRound >= currentState.totalRounds) {
          currentState.phase = 'game_over';
          currentState.phaseTimeRemaining = 999;

          // Determine winner
          const topLeader = currentState.leaderboard[0];
          if (topLeader) {
            currentState.winner = {
              userId: topLeader.userId,
              displayName: topLeader.displayName,
              avatarUrl: topLeader.avatarUrl,
              score: topLeader.score,
            };
          }

          room.status = 'ended';
          io.to(`room:${roomCode}`).emit('room:update', room);
          clearInterval(interval);
        } else {
          currentState.currentRound += 1;
          currentState.phase = 'countdown';
          currentState.phaseTimeRemaining = 3;
          currentState.phaseTotalTime = 3;
        }
        break;
      }

      default:
        break;
    }

    io.to(`room:${roomCode}`).emit('game:update', currentState);
  }, 1000);

  gameTimerIntervals.set(roomCode, interval);
}

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('room:join', ({ code, user }) => {
    const roomCode = (code || '').toUpperCase();
    const room = roomsStore.get(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    socket.join(`room:${roomCode}`);

    // Update connection status
    const player = room.players.find((p) => p.userId === user.id);
    if (player) {
      player.connectionStatus = 'online';
    } else {
      room.players.push({
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isHost: room.players.length === 0,
        isReady: false,
        connectionStatus: 'online',
        score: 0,
        streak: 0,
        joinedAt: new Date().toISOString(),
      });
    }

    io.to(`room:${roomCode}`).emit('room:update', room);

    // Send existing game state if game in progress
    const activeGameState = gameStatesStore.get(roomCode);
    if (activeGameState) {
      socket.emit('game:update', activeGameState);
    }
  });

  socket.on('room:toggle_ready', ({ code, userId, isReady }) => {
    const room = roomsStore.get(code);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (player) {
      player.isReady = isReady;
      io.to(`room:${code}`).emit('room:update', room);
    }
  });

  socket.on('room:update_settings', ({ code, settings, gameId }) => {
    const room = roomsStore.get(code);
    if (!room) return;

    if (settings) room.settings = { ...room.settings, ...settings };
    if (gameId) room.gameId = gameId;

    io.to(`room:${code}`).emit('room:update', room);
  });

  socket.on('room:chat', ({ code, sender, content }) => {
    const room = roomsStore.get(code);
    if (!room) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      senderId: sender.id,
      senderName: sender.displayName,
      senderAvatar: sender.avatarUrl,
      content,
      type: 'chat',
      timestamp: new Date().toISOString(),
    };

    room.chatMessages.push(newMsg);
    io.to(`room:${code}`).emit('room:chat_message', newMsg);
    io.to(`room:${code}`).emit('room:update', room);
  });

  socket.on('room:add_bot', ({ code }) => {
    const room = roomsStore.get(code);
    if (!room) return;

    const botNames = ['CyberBot 🤖', 'ByteSized 👾', 'AlgoRhythm 🎧', 'PixelQueen 👑'];
    const botAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    ];

    const botIndex = room.players.filter((p) => p.userId.startsWith('usr_bot')).length;
    const botId = `usr_bot_${Date.now()}_${botIndex}`;

    const newBot: RoomPlayer = {
      userId: botId,
      displayName: botNames[botIndex % botNames.length],
      avatarUrl: botAvatars[botIndex % botAvatars.length],
      isHost: false,
      isReady: true,
      connectionStatus: 'online',
      score: 0,
      streak: 0,
      joinedAt: new Date().toISOString(),
    };

    room.players.push(newBot);
    room.chatMessages.push({
      id: `msg_${Date.now()}`,
      senderId: 'system',
      senderName: 'CircleUp',
      content: `${newBot.displayName} joined as an AI Bot!`,
      type: 'system',
      timestamp: new Date().toISOString(),
    });

    io.to(`room:${code}`).emit('room:update', room);
  });

  socket.on('room:kick', ({ code, targetUserId }) => {
    const room = roomsStore.get(code);
    if (!room) return;

    room.players = room.players.filter((p) => p.userId !== targetUserId);
    io.to(`room:${code}`).emit('room:update', room);
    io.to(`room:${code}`).emit('room:player_kicked', { userId: targetUserId });
  });

  socket.on('room:transfer_host', ({ code, targetUserId }) => {
    const room = roomsStore.get(code);
    if (!room) return;

    room.players.forEach((p) => {
      p.isHost = p.userId === targetUserId;
    });
    room.hostId = targetUserId;
    io.to(`room:${code}`).emit('room:update', room);
  });

  socket.on('game:start', ({ code }) => {
    startGameStateLoop(code);
  });

  socket.on('game:submit_answer', ({ code, userId, answer, timeTaken }) => {
    const gameState = gameStatesStore.get(code);
    if (!gameState || gameState.phase !== 'question') return;

    gameState.playerAnswers[userId] = {
      answer,
      timeTaken: timeTaken || 5,
      scoreEarned: 0,
    };

    io.to(`room:${code}`).emit('game:update', gameState);

    // If all players answered, immediately advance
    const room = roomsStore.get(code);
    if (room && Object.keys(gameState.playerAnswers).length >= room.players.length) {
      gameState.phaseTimeRemaining = 0; // Trigger instant transition
    }
  });

  socket.on('game:reset', ({ code }) => {
    const room = roomsStore.get(code);
    if (!room) return;

    if (gameTimerIntervals.has(code)) {
      clearInterval(gameTimerIntervals.get(code));
      gameTimerIntervals.delete(code);
    }

    gameStatesStore.delete(code);
    room.status = 'lobby';
    room.players.forEach((p) => {
      p.isReady = false;
      p.score = 0;
    });

    io.to(`room:${code}`).emit('room:update', room);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Vite Development or Static Production Middleware
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CircleUp server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
