import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient, User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER SECRET';
const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: User;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const jwtToken = authHeader?.split(" ")[1]; // Extract the JWT token from the header

    if (!jwtToken) {
        console.log("No JWT token provided");
        return res.status(401).json({error: 'No token provided'});
    }

    try {
        const payload = jwt.verify(jwtToken, JWT_SECRET) as JwtPayload;

        if (typeof payload !== 'object' || !payload.sub) {
            console.log("Invalid or missing payload.sub in JWT");
            return res.status(401).json({error: 'Invalid token payload'});
        }

        const userId = parseInt(payload.sub);
        if (!userId) {
            console.log("Payload sub cannot be parsed into user ID");
            return res.status(401).json({error: 'Invalid user ID in token'});
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.log("No user found with ID:", userId);
            return res.status(401).json({error: 'User not found or token does not match any user'});
        }

        req.user = user;
        next();
    } catch (e) {
        console.error("Error during token verification:", e);
        return res.status(401).json({error: 'Failed to authenticate token', details: e instanceof Error ? e.message : 'Unknown error'});
    }
}