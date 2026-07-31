import { Request, Response } from "express";
import { authService, guestService } from "../services/auth";
import { RegisterRequest, LoginRequest, GoogleLoginRequest, RefreshTokenRequest } from "../dto/requests";
import { ApiResponse, AuthResponse, UserProfileResponse } from "../dto/responses";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const body: RegisterRequest = req.body;
      const data = await authService.register(body);
      const response: ApiResponse<AuthResponse> = { success: true, data };
      res.status(201).json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const body: LoginRequest = req.body;
      const data = await authService.login(body);
      const response: ApiResponse<AuthResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(401).json(response);
    }
  }

  async guest(req: Request, res: Response) {
    try {
      const { nickname } = req.body;
      const data = guestService.login(nickname);
      const response: ApiResponse<AuthResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async google(req: Request, res: Response) {
    try {
      const { idToken, accessToken } = req.body;
      const data = await authService.googleAuth(idToken, accessToken);
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(401).json(response);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const refreshToken = req.body?.refreshToken;
      const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
      await authService.logout(userId, refreshToken, accessToken);
      const response: ApiResponse = { success: true, message: "Logged out" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const body: RefreshTokenRequest = req.body;
      const data = await authService.refresh(body.refreshToken);
      const response: ApiResponse<AuthResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(401).json(response);
    }
  }

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = await authService.getMe(userId);
      const response: ApiResponse<UserProfileResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(401).json(response);
    }
  }
}

export const authController = new AuthController();
