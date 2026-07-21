import mongoose, { Schema, Document } from "mongoose";

export interface IGameHistory extends Document {
  id: string;
  roomId: string;
  gameId: string;
  winnerIds: string[];
  players: string[];
  startedAt: Date;
  endedAt: Date;
  metadata?: Record<string, unknown>;
}

const gameHistorySchema = new Schema<IGameHistory>({
  roomId: { type: String, required: true },
  gameId: { type: String, required: true, ref: "GameDefinition" },
  winnerIds: [{ type: String, ref: "User" }],
  players: [{ type: String, ref: "User" }],
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
  metadata: { type: Schema.Types.Mixed },
});

gameHistorySchema.index({ gameId: 1 });
gameHistorySchema.index({ players: 1 });

export const GameHistory = mongoose.model<IGameHistory>("GameHistory", gameHistorySchema);
