import { notificationRepository } from "../repositories/NotificationRepository";
import { NotificationType } from "../enums";
import { NotificationResponse, UnreadNotificationsResponse } from "../dto/responses";
import { INotification } from "../models/Notification";
import { logger } from "../utils/logger";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  category: "social" | "game" | "system";
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  expiresAt?: Date;
}

export class NotificationService {
  // ── Internal create (called by other services) ──

  async create(input: CreateNotificationInput): Promise<INotification> {
    const notification = await notificationRepository.create(input);
    logger.info({ userId: input.userId, type: input.type }, "Notification created");
    // TODO: emit socket event notification:new
    return notification;
  }

  async notifyUsers(userIds: string[], input: Omit<CreateNotificationInput, "userId">): Promise<void> {
    await Promise.all(userIds.map((userId) => this.create({ ...input, userId })));
  }

  // ── Helper methods for common notifications ──

  async notifyFriendRequest(recipientId: string, senderName: string, senderId: string): Promise<void> {
    await this.create({
      userId: recipientId,
      type: NotificationType.FRIEND_REQUEST,
      category: "social",
      title: "New Friend Request",
      message: `${senderName} sent you a friend request.`,
      actionUrl: "/friends/requests",
      data: { senderId },
    });
  }

  async notifyFriendAccepted(requesterId: string, accepterName: string, accepterId: string): Promise<void> {
    await this.create({
      userId: requesterId,
      type: NotificationType.FRIEND_ACCEPTED,
      category: "social",
      title: "Friend Request Accepted",
      message: `${accepterName} accepted your friend request.`,
      actionUrl: "/friends",
      data: { accepterId },
    });
  }

  async notifyRoomInvite(userId: string, inviterName: string, roomCode: string): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.ROOM_INVITE,
      category: "game",
      title: "Room Invite",
      message: `${inviterName} invited you to join room ${roomCode}.`,
      actionUrl: `/rooms/${roomCode}`,
      data: { roomCode },
    });
  }

  async notifyGameStarted(userIds: string[], gameSlug: string, roomCode: string): Promise<void> {
    await this.notifyUsers(userIds, {
      type: NotificationType.GAME_STARTED,
      category: "game",
      title: "Game Starting",
      message: `The game is starting in room ${roomCode}!`,
      actionUrl: `/rooms/${roomCode}`,
      data: { gameSlug, roomCode },
    });
  }

  async notifyGameFinished(userIds: string[], winnerName: string, roomCode: string): Promise<void> {
    await this.notifyUsers(userIds, {
      type: NotificationType.GAME_FINISHED,
      category: "game",
      title: "Game Finished",
      message: `${winnerName} won the game!`,
      actionUrl: `/rooms/${roomCode}`,
      data: { winnerName, roomCode },
    });
  }

  async notifyAchievement(userId: string, achievementName: string): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.ACHIEVEMENT,
      category: "game",
      title: "Achievement Unlocked",
      message: `You unlocked: ${achievementName}`,
      data: { achievementName },
    });
  }

  async notifyAdminAnnouncement(userIds: string[], title: string, message: string): Promise<void> {
    await this.notifyUsers(userIds, {
      type: NotificationType.ADMIN,
      category: "system",
      title,
      message,
    });
  }

  // ── Public query methods (used by controller) ──

  async getNotifications(userId: string, page: number, limit: number): Promise<NotificationResponse[]> {
    const notifications = await notificationRepository.findByUser(userId, page, limit);
    return notifications.map((n) => this.toResponse(n));
  }

  async getUnreadNotifications(userId: string): Promise<UnreadNotificationsResponse> {
    const [count, notifications] = await Promise.all([
      notificationRepository.countUnread(userId),
      notificationRepository.findUnread(userId),
    ]);
    return {
      count,
      notifications: notifications.map((n) => this.toResponse(n)),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    if (notification.userId !== userId) {
      throw new Error("Not authorized");
    }
    await notificationRepository.markRead(notificationId);
    // TODO: emit socket event notification:read
  }

  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
    // TODO: emit socket event notification:cleared
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    if (notification.userId !== userId) {
      throw new Error("Not authorized");
    }
    await notificationRepository.deleteById(notificationId);
    // TODO: emit socket event notification:deleted
  }

  async clear(userId: string): Promise<void> {
    await notificationRepository.deleteAllByUser(userId);
    // TODO: emit socket event notification:cleared
  }

  private toResponse(n: INotification): NotificationResponse {
    return {
      id: n.id,
      type: n.type,
      category: n.category,
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl,
      data: n.data,
      read: n.read,
      createdAt: n.createdAt,
    };
  }
}

export const notificationService = new NotificationService();
