import mongoose, { Schema, Document } from "mongoose";
import { FriendshipStatus } from "../enums";

export interface IFriendship extends Document {
  id: string;
  requesterId: string;
  recipientId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    requesterId: { type: String, required: true, ref: "User" },
    recipientId: { type: String, required: true, ref: "User" },
    status: {
      type: String,
      enum: Object.values(FriendshipStatus),
      default: FriendshipStatus.PENDING,
    },
  },
  { timestamps: true }
);

friendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

export const Friendship = mongoose.model<IFriendship>("Friendship", friendshipSchema);
