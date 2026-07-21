import mongoose, { Schema, Document } from "mongoose";
import { AuthProvider, UserRole } from "../enums";

export interface IUser extends Document {
  id: string;
  email: string;
  passwordHash?: string;
  provider: AuthProvider;
  googleId?: string;
  displayName: string;
  nickname: string;
  avatarUrl?: string;
  role: UserRole;
  gamesPlayed: number;
  gamesWon: number;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    provider: { type: String, enum: Object.values(AuthProvider), default: AuthProvider.LOCAL },
    googleId: { type: String },
    displayName: { type: String, required: true, trim: true },
    nickname: { type: String, required: true, unique: true, trim: true },
    avatarUrl: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model<IUser>("User", userSchema);
