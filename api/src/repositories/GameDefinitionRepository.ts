import { GameDefinition, IGameDefinition } from "../models/GameDefinition";

export class GameDefinitionRepository {
  async findAll(): Promise<IGameDefinition[]> {
    return GameDefinition.find().sort({ name: 1 });
  }

  async findEnabled(): Promise<IGameDefinition[]> {
    return GameDefinition.find({ enabled: true }).sort({ name: 1 });
  }

  async findBySlug(slug: string): Promise<IGameDefinition | null> {
    return GameDefinition.findOne({ slug });
  }

  async findById(id: string): Promise<IGameDefinition | null> {
    return GameDefinition.findById(id);
  }

  async create(data: Partial<IGameDefinition>): Promise<IGameDefinition> {
    return GameDefinition.create(data);
  }

  async updateById(id: string, data: Partial<IGameDefinition>): Promise<IGameDefinition | null> {
    return GameDefinition.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<void> {
    await GameDefinition.findByIdAndDelete(id);
  }
}

export const gameDefinitionRepository = new GameDefinitionRepository();
