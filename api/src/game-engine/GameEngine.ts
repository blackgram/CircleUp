import { GameAdapter } from "../types";
import { logger } from "../utils/logger";

class GameEngine {
  private adapters = new Map<string, GameAdapter>();

  register(adapter: GameAdapter): void {
    this.adapters.set(adapter.slug, adapter);
    logger.info({ slug: adapter.slug }, "Game adapter registered");
  }

  get(slug: string): GameAdapter | undefined {
    return this.adapters.get(slug);
  }

  getAll(): GameAdapter[] {
    return Array.from(this.adapters.values());
  }

  has(slug: string): boolean {
    return this.adapters.has(slug);
  }
}

export const gameEngine = new GameEngine();
