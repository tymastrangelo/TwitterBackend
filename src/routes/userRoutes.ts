import { Router } from "express";
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
    const { email, name, username } = req.body;
    try {
        const user = await prisma.user.create({
            data: { email, name, username }
        });
        res.json(user);
    } catch (e) {
        res.status(400).json({ error: 'Error creating user' });
    }
});

router.get('/', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

router.get('/me', async (req, res) => {
    // Assuming there's logic here similar to what was used in authenticateToken
    // Normally it would use the req.user set by the middleware
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
});

router.put('/updateUsername', async (req, res) => {
    const { userId, newUsername } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { username: newUsername }
        });
        res.status(200).json({ message: 'Username updated successfully', user });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

export default router;