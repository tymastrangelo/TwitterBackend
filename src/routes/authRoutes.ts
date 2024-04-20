import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import { sendEmailToken } from "../services/emailService";

const EMAIL_TOKEN_EXPIRATION_MINUTES = 10;
const AUTHENTICATION_EXPIRATION_DAYS = 30;
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER SECRET';

const router = Router();
const prisma = new PrismaClient();

// Generate a random 8 digit number as the email token
function  generateEmailToken(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

function generateAuthToken(tokenId: number): string {
  const jwtPayload = { tokenId };

  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: "HS256",
    noTimestamp: true,
  })
}

// register a new account
router.post('/register', async (req, res) => {
  const { email, username, name } = req.body;

  if (!email || !username || !name) {
    return res.status(400).json({ error: "Email, username, and name are required" });
  }

  try {
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    await prisma.user.create({ data: { email, username, name } });
    res.status(200).json({ message: "Account created successfully" });
  } catch (error) {
    // Type guard to check if error is an instance of Error
    if (error instanceof Error) {
      console.error('Account creation failed:', error);
      res.status(400).json({ error: `Couldn't create the account: ${error.message}` });
    } else {
      console.error('Account creation failed with unknown error:', error);
      res.status(400).json({ error: "Couldn't create the account due to an unknown error." });
    }
  }
});

// Create a user. If it doesn't exist, 
// generate the emailToken and send it to their email
router.post('/login', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user with the provided email exists
    const userExists = await prisma.user.findUnique({
      where: { email }
    });
    
    // If no user exists, return a specific error message prompting registration
    if (!userExists) {
      return res.status(404).json({ message: "No account associated with this email. Please create an account." });
    }

    // If user exists, proceed with the login process
    const emailToken = generateEmailToken();
    const expiration = new Date(new Date().getTime() + EMAIL_TOKEN_EXPIRATION_MINUTES * 60 * 1000);
    const createdToken = await prisma.token.create({
      data: {
        type: "EMAIL",
        emailToken,
        expiration,
        user: {
          connect: { email },
        },
      },
    });

    await sendEmailToken(email, emailToken);
    res.status(200).send({ message: "Login token sent to your email." });
  } catch (e) {
    console.error("Error during login process:", e);
    res.status(400).json({ error: "Couldn't start the authentication process" });
  }
});


// Validate the emailToken
// Generate a long-lived JWT token
router.post('/authenticate', async (req, res) => {
  const {email, emailToken} = req.body;

  const dbEmailToken = await prisma.token.findUnique({
    where: {
      emailToken,
    },
    include: {
      user: true
    },
  });

  if ( !dbEmailToken || !dbEmailToken.valid ) {
    return res.sendStatus(401);
  }

  if (dbEmailToken.expiration < new Date()) {
    return res.status(401).json({error: "Token expired!"});
  }

  if (dbEmailToken?.user?.email !== email) {
    return res.sendStatus(401);
  }

  // At this point, we validated that the user is the owner of the email

  // generate an API token
  const expiration = new Date(
    new Date().getTime() + AUTHENTICATION_EXPIRATION_DAYS * 30 * 24 * 60 * 60 * 1000 // sets expiration time to 30 days (in milliseconds)
  );

  const apiToken = await prisma.token.create({
    data: {
      type: "API",
      expiration,
      user: {
        connect: {
          email,
        },
      },
    },
  });

  // Invalidate the email
  await prisma.token.update({
    where: { id: dbEmailToken.id },
    data: { valid: false },
  });

  // generate the JWT token
  const authToken = generateAuthToken(apiToken.id);

    
  res.json({authToken});
})

export default router;