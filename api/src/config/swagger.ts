import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Game World API",
      version: "1.0.0",
      description: "Multiplayer party game platform API",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
    ],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User profile management" },
      { name: "Friends", description: "Friend system" },
      { name: "Rooms", description: "Room management" },
      { name: "Games", description: "Game catalog" },
      { name: "Notifications", description: "Notification system" },
      { name: "Admin", description: "Admin operations" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object" },
            errors: { type: "array", items: { type: "string" } },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "nickname", "displayName"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            nickname: { type: "string" },
            displayName: { type: "string" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        GoogleLoginRequest: {
          type: "object",
          required: ["idToken"],
          properties: {
            idToken: { type: "string" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
        UserProfileResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            displayName: { type: "string" },
            nickname: { type: "string" },
            avatarUrl: { type: "string" },
            gamesPlayed: { type: "number" },
            gamesWon: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/UserProfileResponse" },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        CreateRoomRequest: {
          type: "object",
          required: ["gameSlug", "maxPlayers", "privateRoom"],
          properties: {
            gameSlug: { type: "string" },
            maxPlayers: { type: "number" },
            privateRoom: { type: "boolean" },
          },
        },
        JoinRoomRequest: {
          type: "object",
          required: ["roomCode"],
          properties: {
            roomCode: { type: "string" },
          },
        },
        RoomResponse: {
          type: "object",
          properties: {
            roomCode: { type: "string" },
            hostId: { type: "string" },
            gameSlug: { type: "string" },
            status: { type: "string", enum: ["WAITING", "STARTING", "PLAYING", "FINISHED"] },
            players: { type: "array", items: { $ref: "#/components/schemas/RoomPlayerResponse" } },
            settings: { type: "object" },
          },
        },
        RoomPlayerResponse: {
          type: "object",
          properties: {
            userId: { type: "string" },
            nickname: { type: "string" },
            avatarUrl: { type: "string" },
            ready: { type: "boolean" },
            connected: { type: "boolean" },
            score: { type: "number" },
          },
        },
        GameResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            icon: { type: "string" },
            minPlayers: { type: "number" },
            maxPlayers: { type: "number" },
            enabled: { type: "boolean" },
          },
        },
        FriendResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            displayName: { type: "string" },
            nickname: { type: "string" },
            avatarUrl: { type: "string" },
            status: { type: "string", enum: ["PENDING", "ACCEPTED", "REJECTED", "BLOCKED"] },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
