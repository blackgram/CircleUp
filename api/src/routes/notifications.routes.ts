import { Router } from "express";
import { notificationController } from "../controllers/NotificationController";
import { authenticate } from "../middleware/authenticate";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications (paginated)
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
 *         description: Notifications list
 */
notificationsRouter.get("/", notificationController.getNotifications);

/**
 * @openapi
 * /api/notifications/unread:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notifications with count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications and count
 */
notificationsRouter.get("/unread", notificationController.getUnreadNotifications);

/**
 * @openapi
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
notificationsRouter.patch("/read-all", notificationController.markAllAsRead);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
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
 *         description: Marked as read
 */
notificationsRouter.patch("/:id/read", notificationController.markAsRead);

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
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
 *         description: Notification deleted
 */
notificationsRouter.delete("/:id", notificationController.deleteNotification);

/**
 * @openapi
 * /api/notifications:
 *   delete:
 *     tags: [Notifications]
 *     summary: Clear all notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 */
notificationsRouter.delete("/", notificationController.clearNotifications);
