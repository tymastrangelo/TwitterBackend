import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER SECRET';

const prisma = new PrismaClient();

type AuthRequest = Request & {user?: User} 

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const jwtToken = authHeader?.split(" ")[1]; // Extract the JWT token from the header
  if (!jwtToken) {
      return res.status(401).json({error: 'No token provided'});
  }
  try {
      const payload = await jwt.verify(jwtToken, JWT_SECRET) as { tokenId: number };
      if (!payload.tokenId) {
          return res.status(401).json({error: 'Invalid token payload'});
      }
      const dbToken = await prisma.token.findUnique({
          where: { id: payload.tokenId },
          include: { user: true },
      });
      if (!dbToken?.valid || dbToken.expiration < new Date()) {
          return res.status(401).json({error: 'Token is expired or invalid'});
      }
      req.user = dbToken.user; // Attach user to request if valid
  } catch (e) {
      return res.status(401).json({error: 'Failed to authenticate token'});
  }
  next();
}
