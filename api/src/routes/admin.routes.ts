import { Router } from "express";
import { adminController } from "../controllers/AdminController";
import { authenticate } from "../middleware/authenticate";
import { authorizeAdmin } from "../middleware/authorizeAdmin";

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate);
adminRouter.use(authorizeAdmin);

/**
 * @openapi
 * /api/admin/games:
 *   post:
 *     tags: [Admin]
 *     summary: Create a game definition
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, description, minPlayers, maxPlayers]
 *             properties:
 *               name:
 *                 type: string
 *                 example: G Trivia
 *               slug:
 *                 type: string
 *                 example: g-trivia
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               minPlayers:
 *                 type: number
 *                 example: 2
 *               maxPlayers:
 *                 type: number
 *                 example: 10
 *               settingsSchema:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [boolean, number, string, select]
 *                     label:
 *                       type: string
 *                     default: {}
 *     responses:
 *       201:
 *         description: Game created
 *       400:
 *         description: Validation error or slug already exists
 */
adminRouter.post("/games", adminController.createGame);

/**
 * @openapi
 * /api/admin/games/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a game definition
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               minPlayers:
 *                 type: number
 *               maxPlayers:
 *                 type: number
 *               settingsSchema:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Game updated
 *       400:
 *         description: Validation error
 */
adminRouter.patch("/games/:id", adminController.updateGame);

/**
 * @openapi
 * /api/admin/games/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game deleted
 */
adminRouter.delete("/games/:id", adminController.deleteGame);

/**
 * @openapi
 * /api/admin/games/{id}/enable:
 *   patch:
 *     tags: [Admin]
 *     summary: Enable a game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game enabled
 */
adminRouter.patch("/games/:id/enable", adminController.enableGame);

/**
 * @openapi
 * /api/admin/games/{id}/disable:
 *   patch:
 *     tags: [Admin]
 *     summary: Disable a game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game disabled
 */
adminRouter.patch("/games/:id/disable", adminController.disableGame);

/**
 * @openapi
 * /api/admin/rooms:
 *   get:
 *     tags: [Admin]
 *     summary: List all active rooms
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms list
 */
adminRouter.get("/rooms", adminController.getRooms);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Users list
 */
adminRouter.get("/users", adminController.getUsers);

/**
 * @openapi
 * /api/admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 */
adminRouter.get("/analytics", adminController.getAnalytics);
