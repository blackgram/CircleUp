import { Request, Response } from "express";
import { roomService } from "../services/RoomService";
import { ApiResponse, RoomResponse } from "../dto/responses";
import { GameSession } from "../types";

export class RoomController {
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { maxPlayers, privateRoom } = req.body;
      const data = await roomService.create(userId, maxPlayers, privateRoom);
      const response: ApiResponse<RoomResponse> = { success: true, data };
      res.status(201).json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async join(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { roomCode } = req.body;
      if (!roomCode) {
        res.status(400).json({ success: false, message: "roomCode is required" });
        return;
      }
      const data = await roomService.join(userId, roomCode);
      const response: ApiResponse<RoomResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async leave(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { roomCode } = req.body;
      if (!roomCode) {
        res.status(400).json({ success: false, message: "roomCode is required" });
        return;
      }
      await roomService.leave(userId, roomCode);
      const response: ApiResponse = { success: true, message: "Left room" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const data = await roomService.getByCode(req.params.roomCode as string);
      const response: ApiResponse<RoomResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(404).json(response);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await roomService.deleteRoom(userId, req.params.roomCode as string);
      const response: ApiResponse = { success: true, message: "Room deleted" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { gameSlug, maxPlayers, privateRoom, gameOptions } = req.body;
      const data = await roomService.updateSettings(userId, req.params.roomCode as string, {
        ...(gameSlug !== undefined && { gameSlug }),
        ...(maxPlayers !== undefined && { maxPlayers }),
        ...(privateRoom !== undefined && { privateRoom }),
        ...(gameOptions !== undefined && { gameOptions }),
      });
      const response: ApiResponse<RoomResponse> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async start(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = await roomService.startGame(userId, req.params.roomCode as string);
      const response: ApiResponse<GameSession> = { success: true, data };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }

  async end(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await roomService.endGame(userId, req.params.roomCode as string);
      const response: ApiResponse = { success: true, message: "Game ended" };
      res.json(response);
    } catch (err: any) {
      const response: ApiResponse = { success: false, message: err.message };
      res.status(400).json(response);
    }
  }
}

export const roomController = new RoomController();
