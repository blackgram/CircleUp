import { Request, Response } from "express";
import { friendService } from "../services/FriendService";
import { ApiResponse, FriendResponse, FriendRequestResponse } from "../dto/responses";

export class FriendController {
  async list(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = await friendService.listFriends(userId);
      const response: ApiResponse<FriendResponse[]> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async sendRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { userId: recipientId } = req.body;
      if (!recipientId) {
        const response: ApiResponse = { success: false, message: "userId is required" };
        res.status(400).json(response);
        return;
      }
      await friendService.sendRequest(userId, recipientId);
      const response: ApiResponse = { success: true, message: "Friend request sent" };
      res.status(201).json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async acceptRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { friendshipId } = req.body;
      if (!friendshipId) {
        const response: ApiResponse = { success: false, message: "friendshipId is required" };
        res.status(400).json(response);
        return;
      }
      await friendService.acceptRequest(userId, friendshipId);
      const response: ApiResponse = { success: true, message: "Friend request accepted" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async rejectRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { friendshipId } = req.body;
      if (!friendshipId) {
        const response: ApiResponse = { success: false, message: "friendshipId is required" };
        res.status(400).json(response);
        return;
      }
      await friendService.rejectRequest(userId, friendshipId);
      const response: ApiResponse = { success: true, message: "Friend request rejected" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const friendshipId = req.params.id as string;
      await friendService.removeFriend(userId, friendshipId);
      const response: ApiResponse = { success: true, message: "Friend removed" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async getRequests(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = await friendService.getPendingRequests(userId);
      const response: ApiResponse<FriendRequestResponse[]> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }
}

export const friendController = new FriendController();
