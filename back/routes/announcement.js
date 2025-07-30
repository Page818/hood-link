// routes/announcement.js
import express from "express";
import { createAnnouncement } from "../controllers/announcementController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/create", auth, createAnnouncement);

export default router;
