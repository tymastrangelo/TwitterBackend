import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = "SUPER SECRET";

// Ensure user is authenticated before processing any requests
router.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
});

// Create tweet
router.post('/', async (req, res) => {
  const { content, image } = req.body;

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: No user found" });
  }
  
  const userId = req.user.id;

  try {
    const result = await prisma.tweet.create({
      data: {
        content,
        image,
        userId,
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
      createdAt: 'desc',
    },
    include: {
      user: true,
    },
  });
  res.json(allTweets);
});

// Get one tweet
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const tweet = await prisma.tweet.findUnique({
    where: { id: Number(id) },
    include: { user: true },
  });
  if (!tweet) {
    return res.status(404).json({ error: "Tweet not found!" });
  }
  res.json(tweet);
});

// Like a tweet
router.post('/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        tweetId: Number(id),
        userId: req.user.id,
      }
    });

    if (existingLike) {
      return res.status(400).json({ message: 'Already liked this tweet' });
    }

    const like = await prisma.like.create({
      data: {
        tweetId: Number(id),
        userId: req.user.id,
      }
    });

    return res.json({ message: 'Liked', like });
  } catch (error) {
    return res.status(500).json({ error: 'Error liking tweet', details: error });
  }
});

// Unlike a tweet
router.delete('/:id/unlike', async (req, res) => {
  const { id } = req.params;

  try {
    const like = await prisma.like.deleteMany({
      where: {
        tweetId: Number(id),
        userId: req.user.id,
      }
    });

    if (like.count === 0) {
      return res.status(404).json({ message: 'Like not found or already unliked' });
    }

    return res.json({ message: 'Unliked', like });
  } catch (error) {
    return res.status(500).json({ error: 'Error unliking tweet', details: error });
  }
});

// Delete tweet with ownership check
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const tweet = await prisma.tweet.findUnique({
      where: { id: Number(id) },
    });

    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    if (tweet.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own tweets" });
    }

    await prisma.tweet.delete({
      where: { id: Number(id) },
    });

    res.sendStatus(200); // OK status
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;