import { Router } from "express";
import { friendController } from "../controllers/FriendController";
import { authenticate } from "../middleware/authenticate";

export const friendsRouter = Router();

// All friend routes require authentication
friendsRouter.use(authenticate);

/**
 * @openapi
 * /api/friends:
 *   get:
 *     tags: [Friends]
 *     summary: List friends
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friends list
 */
friendsRouter.get("/", friendController.list);

/**
 * @openapi
 * /api/friends/request:
 *   post:
 *     tags: [Friends]
 *     summary: Send a friend request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request sent
 */
friendsRouter.post("/request", friendController.sendRequest);

/**
 * @openapi
 * /api/friends/accept:
 *   post:
 *     tags: [Friends]
 *     summary: Accept a friend request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendshipId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request accepted
 */
friendsRouter.post("/accept", friendController.acceptRequest);

/**
 * @openapi
 * /api/friends/reject:
 *   post:
 *     tags: [Friends]
 *     summary: Reject a friend request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendshipId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 */
friendsRouter.post("/reject", friendController.rejectRequest);

/**
 * @openapi
 * /api/friends/requests:
 *   get:
 *     tags: [Friends]
 *     summary: Get pending friend requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests
 */
friendsRouter.get("/requests", friendController.getRequests);

/**
 * @openapi
 * /api/friends/{id}:
 *   delete:
 *     tags: [Friends]
 *     summary: Remove a friend
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
 *         description: Friend removed
 */
friendsRouter.delete("/:id", friendController.remove);
