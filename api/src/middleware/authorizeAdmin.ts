import { Request, Response, NextFunction } from "express";
import { UserRole } from "../enums";
import { ApiResponse } from "../dto/responses";

export function authorizeAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req as any).userRole;

  if (role !== UserRole.ADMIN) {
    const response: ApiResponse = { success: false, message: "Admin access required" };
    res.status(403).json(response);
    return;
  }

  next();
}
