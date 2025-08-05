// routes/disasterCheck.js
import express from "express";
import {
	createDisasterCheck,
	replyDisasterCheck,
} from "../controllers/disasterCheck.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 建立災害緊急回報訊息
router.post("/", auth, createDisasterCheck);

// 用戶回復
router.post("/:id/reply", auth, replyDisasterCheck);

export default router;
