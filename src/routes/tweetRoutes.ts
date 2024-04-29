import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = "SUPER SECRET";

// Tweet CRUD

// Create tweet
// Assuming we are NOT using a 'likes' column directly
router.get('/', async (req, res) => {
  try {
    const allTweets = await prisma.tweet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true }  // Ensure no erroneous '_count' or 'likes' here
    });
    console.log("Fetched tweets:", allTweets);
    res.json(allTweets);
  } catch (error) {
    console.error("Error fetching tweets:", error);
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
});

// List tweets
router.get('/', async (req, res) => {
  try {
    console.log("Starting to fetch tweets");
    const allTweets = await prisma.tweet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
    console.log("Fetched tweets count:", allTweets.length);
    res.json(allTweets);
  } catch (error) {
    console.error("Error fetching tweets:", error);
    res.status(500).json({ error: "Failed to fetch tweets", details: error });
  }
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

// Update tweet - Placeholder for future implementation
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.status(501).json({ error: `Not Implemented: ${id}` });
});

// Delete tweet with ownership check
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user logged in" });
  }
  try {
    const tweet = await prisma.tweet.findUnique({
      where: { id: Number(id) },
    });
    if (!tweet || tweet.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own tweets" });
    }
    await prisma.tweet.delete({ where: { id: Number(id) } });
    res.sendStatus(200);
  } catch (e) {
    console.error("Failed to delete tweet:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search tweets
router.get('/search/:keyword', async (req, res) => {
  const { keyword } = req.params;
  try {
    const tweets = await prisma.tweet.findMany({
      where: {
        OR: [
          { content: { contains: keyword, mode: 'insensitive' } },
          { user: { username: { contains: keyword, mode: 'insensitive' } } }
        ]
      },
      include: { user: true }
    });
    console.log("Search results:", tweets);
    res.json(tweets);
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
});

export default router;