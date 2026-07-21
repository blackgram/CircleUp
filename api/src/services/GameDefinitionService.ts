import { gameDefinitionRepository } from "../repositories/GameDefinitionRepository";
import { GameResponse } from "../dto/responses";
import { IGameDefinition } from "../models/GameDefinition";

export interface GameDetailResponse extends GameResponse {
  settingsSchema: Record<string, unknown>[];
  version: number;
}

export class GameDefinitionService {
  // ── Public endpoints ──

  async list(): Promise<GameResponse[]> {
    const games = await gameDefinitionRepository.findAll();
    return games.map((g) => this.toResponse(g));
  }

  async getEnabled(): Promise<GameResponse[]> {
    const games = await gameDefinitionRepository.findEnabled();
    return games.map((g) => this.toResponse(g));
  }

  async getBySlug(slug: string): Promise<GameDetailResponse> {
    const game = await gameDefinitionRepository.findBySlug(slug);
    if (!game) throw new Error("Game not found");
    return this.toDetailResponse(game);
  }

  async getPopular(): Promise<GameResponse[]> {
    // For now return enabled games; later sort by play count
    const games = await gameDefinitionRepository.findEnabled();
    return games.map((g) => this.toResponse(g));
  }

  // ── Admin endpoints ──

  async create(data: {
    name: string;
    slug: string;
    description: string;
    icon?: string;
    minPlayers: number;
    maxPlayers: number;
    settingsSchema?: Record<string, unknown>[];
  }): Promise<GameDetailResponse> {
    const existing = await gameDefinitionRepository.findBySlug(data.slug);
    if (existing) throw new Error("Game with this slug already exists");

    const game = await gameDefinitionRepository.create({
      ...data,
      enabled: false,
      settingsSchema: data.settingsSchema || [],
    });
    return this.toDetailResponse(game);
  }

  async update(id: string, data: Partial<IGameDefinition>): Promise<GameDetailResponse> {
    const game = await gameDefinitionRepository.updateById(id, data);
    if (!game) throw new Error("Game not found");
    return this.toDetailResponse(game);
  }

  async delete(id: string): Promise<void> {
    const game = await gameDefinitionRepository.findById(id);
    if (!game) throw new Error("Game not found");
    await gameDefinitionRepository.deleteById(id);
  }

  async enable(id: string): Promise<GameDetailResponse> {
    const game = await gameDefinitionRepository.updateById(id, { enabled: true });
    if (!game) throw new Error("Game not found");
    return this.toDetailResponse(game);
  }

  async disable(id: string): Promise<GameDetailResponse> {
    const game = await gameDefinitionRepository.updateById(id, { enabled: false });
    if (!game) throw new Error("Game not found");
    return this.toDetailResponse(game);
  }

  private toResponse(g: IGameDefinition): GameResponse {
    return {
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      icon: g.icon,
      minPlayers: g.minPlayers,
      maxPlayers: g.maxPlayers,
      enabled: g.enabled,
    };
  }

  private toDetailResponse(g: IGameDefinition): GameDetailResponse {
    return {
      ...this.toResponse(g),
      settingsSchema: g.settingsSchema,
      version: g.version,
    };
  }
}

export const gameDefinitionService = new GameDefinitionService();
