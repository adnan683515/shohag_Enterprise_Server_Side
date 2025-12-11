import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";
import { AppError } from "../errorHelper/AppError";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.AccessToken;  // <-- GET TOKEN FROM COOKIE

    if (!token) {
      throw new AppError(401, 'No Token Provide!')
    }
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET!) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (err: any) {
    next(err)
  }
};
