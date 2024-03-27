import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import { authenticatieToken } from "../middlewares/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// User CRUD

// Create user
router.post('/', async (req,res) => {
    const { email, name, username } = req.body;
    try {
      const result = await prisma.user.create({
        data: {
            email,
            name,
            username,
            bio: "Hello, I'm new on Twitter",
        },
      });

      res.json(result);
    } catch (e) {
        res.status(400).json({ error: "Username and email should be unique" });
    }
});

// List users
router.get('/', async (req,res) => {
    const allUser = await prisma.user.findMany({
        select: { 
            id: true, 
            name: true, 
            image: true,
            bio: true, 
        },
    });

    res.json(allUser);
});

// get one user
router.get('/:id', async (req,res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ 
        where: {id: Number(id)}, 
        include: { tweets: true },
    });

    res.json(user)
});

// update user
router.put('/:id', async (req,res) => {
    const { id } = req.params;
    const { bio, name, image } = req.body;

    try {
      const result = await prisma.user.update({
        where: {id: Number(id)},
        data: { bio, name, image }
      })
      res.json(result);
    } catch(e) {
        res.status(400).json({error: `Failed to update the user` })
    }
});

// delete user
router.delete('/:id', async (req,res) => {
    const { id } = req.params;
    await prisma.user.delete({where: {id: Number(id)}})
    res.sendStatus(200)
});

router.get('/me', authenticatieToken, async (req, res) => {
    const userId = req.user.id; // Assuming req.user is populated by the authMiddleware with the authenticated user's data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });
  

export default router;