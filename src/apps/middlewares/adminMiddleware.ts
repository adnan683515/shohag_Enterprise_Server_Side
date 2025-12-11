import { Response, NextFunction } from "express";
import { AuthRequest } from "./middleware";

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ msg: "Admin only" });
  }
  next();
};