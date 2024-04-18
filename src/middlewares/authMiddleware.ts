import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient, User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER SECRET';
const prisma = new PrismaClient();

// Extending Request to include user information
interface AuthRequest extends Request {
    user?: User;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const jwtToken = authHeader?.split(" ")[1];  // Extract the JWT token from the header

    if (!jwtToken) {
        return res.status(401).json({error: 'No token provided'});
    }

    try {
        const payload = jwt.verify(jwtToken, JWT_SECRET) as JwtPayload;

        // Ensure the payload contains the user ID and is not expired
        if (typeof payload !== 'object' || !payload.sub) {
            return res.status(401).json({error: 'Invalid token payload'});
        }

        // Find the user based on the user ID (sub in JWT)
        const user = await prisma.user.findUnique({
            where: { id: parseInt(payload.sub) }
        });

        if (!user) {
            return res.status(401).json({error: 'User not found or token does not match any user'});
        }

        // Attach user to request if valid
        req.user = user;
    } catch (e) {
        console.error("Token verification failed:", e);
        return res.status(401).json({error: 'Failed to authenticate token', details: e.message});
    }

    next();
}
