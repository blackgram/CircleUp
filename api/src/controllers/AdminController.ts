import { Request, Response } from "express";
import { gameDefinitionService, GameDetailResponse } from "../services/GameDefinitionService";
import { userRepository } from "../repositories/UserRepository";
import { roomStorage } from "../storage";
import { ApiResponse, GameResponse, UserProfileResponse } from "../dto/responses";
import { RoomResponse } from "../dto/responses";

export class AdminController {
  async createGame(req: Request, res: Response) {
    try {
      const { name, slug, description, icon, minPlayers, maxPlayers, settingsSchema } = req.body;
      if (!name || !slug || !description || !minPlayers || !maxPlayers) {
        res.status(400).json({ success: false, message: "Missing required fields" });
        return;
      }
      const data = await gameDefinitionService.create({ name, slug, description, icon, minPlayers, maxPlayers, settingsSchema });
      const response: ApiResponse<GameDetailResponse> = { success: true, data };
      res.status(201).json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async updateGame(req: Request, res: Response) {
    try {
      const data = await gameDefinitionService.update(req.params.id as string, req.body);
      const response: ApiResponse<GameDetailResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async deleteGame(req: Request, res: Response) {
    try {
      await gameDefinitionService.delete(req.params.id as string);
      const response: ApiResponse = { success: true, message: "Game deleted" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async enableGame(req: Request, res: Response) {
    try {
      const data = await gameDefinitionService.enable(req.params.id as string);
      const response: ApiResponse<GameDetailResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async disableGame(req: Request, res: Response) {
    try {
      const data = await gameDefinitionService.disable(req.params.id as string);
      const response: ApiResponse<GameDetailResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async getRooms(req: Request, res: Response) {
    try {
      const rooms = await roomStorage.getAllRooms();
      const data = rooms.map((r) => ({
        roomCode: r.roomCode,
        hostId: r.hostId,
        gameSlug: r.gameSlug,
        status: r.status,
        playerCount: r.players.length,
        createdAt: r.createdAt,
      }));
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const users = await userRepository.findPaginated(page, limit);
      const response: ApiResponse<typeof users> = { success: true, data: users };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const [totalUsers, totalRooms] = await Promise.all([
        userRepository.count(),
        roomStorage.getAllRooms().then((r) => r.length),
      ]);
      const data = {
        totalUsers,
        activeRooms: totalRooms,
      };
      const response: ApiResponse<typeof data> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }
}

export const adminController = new AdminController();
