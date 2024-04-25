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

// Increment likes for a tweet
router.patch('/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    const tweet = await prisma.tweet.update({
      where: { id: Number(id) },
      data: {
        likes: {
          increment: 1
        },
      },
    });
    res.json(tweet);
  } catch (e) {
    res.status(400).json({ error: "Error liking tweet" });
  }
});


// Update tweet - Placeholder for future implementation
router.put('/:id', (req, res) => {
  const { id } = req.params;
  res.status(501).json({ error: `Not Implemented: ${id}` });
});

// Delete tweet with ownership check
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;  // Assuming `req.user` is populated from your auth middleware

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user logged in" });
  }

  try {
    // First find the tweet to check ownership
    const tweet = await prisma.tweet.findUnique({
      where: { id: Number(id) },
    });

    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });
    }

    // Check if the logged-in user is the owner of the tweet
    if (tweet.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own tweets" });
    }

    // Delete the tweet if the user is the owner
    await prisma.tweet.delete({
      where: { id: Number(id) },
    });

    res.sendStatus(200);  // OK status
  } catch (e) {
    console.error("Failed to delete tweet:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/search/:keyword', async (req, res) => {
  const { keyword } = req.params;
  console.log("Received search request for:", keyword); // Log the keyword
  try {
      const tweets = await prisma.tweet.findMany({
          where: {
              OR: [
                  { content: { contains: keyword, mode: 'insensitive' } },
                  { user: { username: { contains: keyword, mode: 'insensitive' } } }
              ]
          },
          include: {
              user: true
          }
      });
      console.log("Search results:", tweets); // Log the results
      res.json(tweets);
  } catch (error) {
      console.error("Error during search:", error); // Log any errors
      res.status(500).json({ error: "Failed to fetch tweets" });
  }
});

export default router;
