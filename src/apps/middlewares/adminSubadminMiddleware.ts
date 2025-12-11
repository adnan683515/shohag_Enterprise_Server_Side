import { Response, NextFunction } from "express";
import { AuthRequest } from "./middleware";


export const adminOrSubadmin = (req: AuthRequest,res: Response,next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  // Allowed roles
  const allowed = ["admin", "subadmin"];

  // Check if user role matches any allowed role
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ msg: "Admin or Subadmin only" });
  }

  next();
};
