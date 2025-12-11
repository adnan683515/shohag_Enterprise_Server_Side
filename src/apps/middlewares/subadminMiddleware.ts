import { Response, NextFunction } from "express";
import { AuthRequest } from "./middleware";

export const subadmin = (req: AuthRequest, res: Response, next: NextFunction) => {

  if (!req.user || req.user.role !== "subadmin") {
    return res.status(403).json({ msg: "Admin only" });
  }

  next();
};