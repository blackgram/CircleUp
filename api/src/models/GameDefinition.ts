import mongoose, { Schema, Document } from "mongoose";

export interface IGameDefinition extends Document {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  minPlayers: number;
  maxPlayers: number;
  enabled: boolean;
  version: number;
  settingsSchema: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
}

const gameDefinitionSchema = new Schema<IGameDefinition>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String },
    minPlayers: { type: Number, required: true, min: 1 },
    maxPlayers: { type: Number, required: true },
    enabled: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    settingsSchema: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export const GameDefinition = mongoose.model<IGameDefinition>("GameDefinition", gameDefinitionSchema);
