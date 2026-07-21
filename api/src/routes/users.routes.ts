import { Router } from "express";
import { userController } from "../controllers/UserController";
import { authenticate } from "../middleware/authenticate";

export const usersRouter = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
usersRouter.get("/me", authenticate, userController.getMe);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               nickname:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 */
usersRouter.patch("/me", authenticate, userController.updateMe);

/**
 * @openapi
 * /api/users/nickname:
 *   patch:
 *     tags: [Users]
 *     summary: Update nickname
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nickname updated
 *       400:
 *         description: Nickname taken or invalid
 */
usersRouter.patch("/nickname", authenticate, userController.updateNickname);

/**
 * @openapi
 * /api/users/search:
 *   get:
 *     tags: [Users]
 *     summary: Search users
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
usersRouter.get("/search", userController.search);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
usersRouter.get("/:id", userController.getById);
