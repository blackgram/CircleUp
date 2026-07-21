import { Router } from "express";
import { gameController } from "../controllers/GameController";

export const gamesRouter = Router();

/**
 * @openapi
 * /api/games:
 *   get:
 *     tags: [Games]
 *     summary: List all game definitions
 *     responses:
 *       200:
 *         description: List of all games
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GameResponse'
 */
gamesRouter.get("/", gameController.list);

/**
 * @openapi
 * /api/games/enabled:
 *   get:
 *     tags: [Games]
 *     summary: List enabled games available to play
 *     responses:
 *       200:
 *         description: Enabled games
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GameResponse'
 */
gamesRouter.get("/enabled", gameController.getEnabled);

/**
 * @openapi
 * /api/games/popular:
 *   get:
 *     tags: [Games]
 *     summary: List popular games sorted by play count
 *     responses:
 *       200:
 *         description: Popular games
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GameResponse'
 */
gamesRouter.get("/popular", gameController.getPopular);

/**
 * @openapi
 * /api/games/{slug}:
 *   get:
 *     tags: [Games]
 *     summary: Get game details including settings schema
 *     description: Returns full game definition with settingsSchema for rendering host configuration UI
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: g-trivia
 *     responses:
 *       200:
 *         description: Game details with settings schema
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/GameResponse'
 *                         - properties:
 *                             settingsSchema:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   key:
 *                                     type: string
 *                                   type:
 *                                     type: string
 *                                     enum: [boolean, number, string, select]
 *                                   label:
 *                                     type: string
 *                                   default: {}
 *                             version:
 *                               type: number
 *       404:
 *         description: Game not found
 */
gamesRouter.get("/:slug", gameController.getBySlug);
