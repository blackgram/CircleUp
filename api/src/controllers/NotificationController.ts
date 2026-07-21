import { Request, Response } from "express";
import { notificationService } from "../services/NotificationService";
import { ApiResponse, NotificationResponse, UnreadNotificationsResponse } from "../dto/responses";

export class NotificationController {
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const data = await notificationService.getNotifications(userId, page, limit);
      const response: ApiResponse<NotificationResponse[]> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async getUnreadNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = await notificationService.getUnreadNotifications(userId);
      const response: ApiResponse<UnreadNotificationsResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await notificationService.markAsRead(userId, req.params.id as string);
      const response: ApiResponse = { success: true, message: "Notification marked as read" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await notificationService.markAllAsRead(userId);
      const response: ApiResponse = { success: true, message: "All notifications marked as read" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async deleteNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await notificationService.delete(userId, req.params.id as string);
      const response: ApiResponse = { success: true, message: "Notification deleted" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async clearNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await notificationService.clear(userId);
      const response: ApiResponse = { success: true, message: "All notifications cleared" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }
}

export const notificationController = new NotificationController();
