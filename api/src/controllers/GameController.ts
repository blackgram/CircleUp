import { Request, Response } from "express";
import { gameDefinitionService, GameDetailResponse } from "../services/GameDefinitionService";
import { ApiResponse, GameResponse } from "../dto/responses";

export class GameController {
  async list(req: Request, res: Response) {
    try {
      const data = await gameDefinitionService.list();
      const response: ApiResponse<GameResponse[]> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const data = await gameDefinitionService.getBySlug(req.params.slug as string);
      const response: ApiResponse<GameDetailResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(404).json(response);
    }
  }

  async getEnabled(req: Request, res: Response) {
    try {
      const data = await gameDefinitionService.getEnabled();
      const response: ApiResponse<GameResponse[]> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }

  async getPopular(req: Request, res: Response) {
    try {
      const data = await gameDefinitionService.getPopular();
      const response: ApiResponse<GameResponse[]> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(500).json(response);
    }
  }
}

export const gameController = new GameController();
