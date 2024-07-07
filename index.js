import express from "express";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
]
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Ensure DATABASE_URL is correctly set in your environment variables
    },
  },
});
   
const port = process.env.PORT || 3000;

app.use(cors({
  origin: "https://accredian-frontend-delta.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(bodyParser.json());

const validateReferral = (req, res, next) => {
  const {
    referrerName,
    referrerEmail,
    referrerPhone,
    relationship,
    refereeName,
    refereeEmail,
    refereePhone,
    program,
  } = req.body;

  if (
    !referrerName ||
    !referrerEmail ||
    !referrerPhone ||
    !relationship ||
    !refereeName ||
    !refereeEmail ||
    !refereePhone ||
    !program
  ) {
    return res
      .status(400)
      .json({ error: "All fields except comments are required" });
  }
  next();
};

app.post("/referrals", validateReferral, async (req, res) => {
  const {
    referrerName,
    referrerEmail,
    referrerPhone,
    relationship,
    refereeName,
    refereeEmail,
    refereePhone,
    program,
    comments,
  } = req.body;

  try {
    const newReferral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        referrerPhone,
        relationship,
        refereeName,
        refereeEmail,
        refereePhone,
        program,
        comments,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: refereeEmail,
      subject: "Referral Confirmation",
      text: `Thank you for the referral, ${refereeName}!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json(newReferral);
  } catch (error) {
    console.error("Error creating referral:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/referrals", async (req, res) => {
  try {
    const referrals = await prisma.referral.findMany();
    res.status(200).json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/referrals/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const referral = await prisma.referral.findUnique({
      where: { id: parseInt(id) },
    });
    if (!referral) {
      return res.status(404).json({ error: "Referral not found" });
    }
    res.status(200).json(referral);
  } catch (error) {
    console.error("Error fetching referral:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
