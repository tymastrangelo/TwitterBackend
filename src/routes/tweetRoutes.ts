import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = "SUPER SECRET";

// Tweet CRUD

// Create tweet
router.post('/', async (req, res) => {
  const { content, image } = req.body;

  // Check if the user object exists in the request
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: No user found" });
  }
  
  // Access userId safely after the check
  const userId = req.user.id;

  try {
    const result = await prisma.tweet.create({
      data: {
        content,
        image,
        userId, // Managed based on the auth user
      },
      include: { user: true },
    });

    res.json(result);
  } catch (e) {
    res.status(400).json({ error: "Error creating tweet" });
  }
});

// List tweets
router.get('/', async (req, res) => {
  const allTweets = await prisma.tweet.findMany({
    orderBy: {
      createdAt: 'desc', // This line orders tweets by creation time, newest first
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true
        },
      },
    },
  });
  res.json(allTweets);
});

// Get one tweet
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Query tweet with id: ', id);
  const tweet = await prisma.tweet.findUnique({
    where: { id: Number(id) },
    include: { user: true },
  });
  if (!tweet) {
    return res.status(404).json({ error: "Tweet not found!" });
  }

  res.json(tweet);
});

// Update tweet - Placeholder for future implementation
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.status(501).json({ error: `Not Implemented: ${id}` });
});

// Delete tweet
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.tweet.delete({ where: { id: Number(id) } });
  res.sendStatus(200);
});

export default router;
