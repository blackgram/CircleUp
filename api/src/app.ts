import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { logger } from "./utils/logger";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { friendsRouter } from "./routes/friends.routes";
import { roomsRouter } from "./routes/rooms.routes";
import { gamesRouter } from "./routes/games.routes";
import { adminRouter } from "./routes/admin.routes";
import { notificationsRouter } from "./routes/notifications.routes";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/swagger.json", (_req, res) => res.json(swaggerSpec));

// Routes
app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/games", gamesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationsRouter);

export default app;
