import mongoose, { Schema, Document } from "mongoose";
import { NotificationType } from "../enums";

export interface INotification extends Document {
  id: string;
  userId: string;
  type: NotificationType;
  category: "social" | "game" | "system";
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, ref: "User", index: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  category: { type: String, enum: ["social", "game", "system"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  actionUrl: { type: String },
  data: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date },
  expiresAt: { type: Date },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
