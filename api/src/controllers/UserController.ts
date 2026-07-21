import { Request, Response } from "express";
import { userService } from "../services/UserService";
import { ApiResponse, UserProfileResponse } from "../dto/responses";
import { UpdateProfileRequest } from "../dto/requests";

export class UserController {
  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = await userService.getProfile(userId);
      const response: ApiResponse<UserProfileResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(404).json(response);
    }
  }

  async updateMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const body: UpdateProfileRequest = req.body;
      const data = await userService.updateProfile(userId, body);
      const response: ApiResponse<UserProfileResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async updateNickname(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { nickname } = req.body;
      if (!nickname) {
        const response: ApiResponse = { success: false, message: "Nickname is required" };
        res.status(400).json(response);
        return;
      }
      const data = await userService.updateNickname(userId, nickname);
      const response: ApiResponse<UserProfileResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await userService.getById(req.params.id as string);
      const response: ApiResponse<UserProfileResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(404).json(response);
    }
  }

  async search(req: Request, res: Response) {
    try {
      const q = req.query.q as string;
      const data = await userService.search(q);
      const response: ApiResponse<UserProfileResponse[]> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }
}

export const userController = new UserController();
