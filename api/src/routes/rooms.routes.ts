import { Router } from "express";
import { roomController } from "../controllers/RoomController";
import { authenticate } from "../middleware/authenticate";

export const roomsRouter = Router();

// All room routes require authentication
roomsRouter.use(authenticate);

/**
 * @openapi
 * /api/rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomRequest'
 *     responses:
 *       201:
 *         description: Room created
 */
roomsRouter.post("/", roomController.create);

/**
 * @openapi
 * /api/rooms/join:
 *   post:
 *     tags: [Rooms]
 *     summary: Join a room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinRoomRequest'
 *     responses:
 *       200:
 *         description: Joined room
 */
roomsRouter.post("/join", roomController.join);

/**
 * @openapi
 * /api/rooms/leave:
 *   post:
 *     tags: [Rooms]
 *     summary: Leave current room
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Left room
 */
roomsRouter.post("/leave", roomController.leave);

/**
 * @openapi
 * /api/rooms/public:
 *   get:
 *     tags: [Rooms]
 *     summary: List public rooms available to join
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public rooms
 */
roomsRouter.get("/public", roomController.getPublicRooms);

/**
 * @openapi
 * /api/rooms/{roomCode}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room by code
 *     parameters:
 *       - in: path
 *         name: roomCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room details
 */
roomsRouter.get("/:roomCode", roomController.getByCode);

/**
 * @openapi
 * /api/rooms/{roomCode}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete a room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room deleted
 */
roomsRouter.delete("/:roomCode", roomController.delete);

/**
 * @openapi
 * /api/rooms/{roomCode}/settings:
 *   patch:
 *     tags: [Rooms]
 *     summary: Update room settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settings updated
 */
roomsRouter.patch("/:roomCode/settings", roomController.updateSettings);

/**
 * @openapi
 * /api/rooms/{roomCode}/start:
 *   post:
 *     tags: [Rooms]
 *     summary: Start game in room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game started
 */
roomsRouter.post("/:roomCode/start", roomController.start);

/**
 * @openapi
 * /api/rooms/{roomCode}/end:
 *   post:
 *     tags: [Rooms]
 *     summary: End game in room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game ended
 */
roomsRouter.post("/:roomCode/end", roomController.end);
