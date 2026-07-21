import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: String, required: true, ref: "User", index: true },
  refreshTokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
});

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>("Session", sessionSchema);
