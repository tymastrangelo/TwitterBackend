import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET';
const prisma = new PrismaClient();

// Extend Express request to include the user
interface AuthRequest extends Request {
    user?: any;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        // Check if decoded is JwtPayload and has userId
        if (typeof decoded !== 'string' && decoded.userId) {
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            req.user = user;
            next();
        } else {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
    } catch (error) {
        if (error instanceof Error) {
            return res.status(401).json({ error: 'Invalid or expired token', details: error.message });
        } else {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }
}