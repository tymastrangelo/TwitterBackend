import { Router } from "express";
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from "../middlewares/authMiddleware";

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

router.get('/me', authenticateToken, async (req, res) => {
  if (!req.user) {
      console.error("Authentication failed: No user attached to request");
      return res.status(401).json({ error: "Authentication failed: No user attached" });
  }
  try {
      const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { email: true, username: true, name: true, image: true }
      });
      
      if (!user) {
          console.error("User retrieval failed: User not found in database");
          return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
  } catch (error) {
      console.error("Database operation failed", error);
      res.status(500).json({ error: "Failed to retrieve user data", details: error.message });
  }
});

export default router;