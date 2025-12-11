import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  isVerified: boolean;
  parentId?: mongoose.Types.ObjectId | null; // New field for hierarchy
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  otp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // New field
});

export const User = mongoose.model<IUser>("User", UserSchema);
