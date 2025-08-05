// routes/dailyGreeting.js
import express from "express";
import {
	createDailyGreeting,
	replyDailyGreeting,
	getUnrepliedUsers,
	getHelpNeededUsers,
} from "../controllers/dailyGreeting.js";
import auth from "../middlewares/auth.js";

const router = express.Router();
// 管理員手動發送每日問候
router.post("/", auth, createDailyGreeting);

// 用戶回覆
router.post("/:id/reply", auth, replyDailyGreeting);

// 多天未回覆名單查詢
router.get("/unreplied", auth, getUnrepliedUsers);

// 需要幫助名單查詢
router.get("/helpneeded", auth, getHelpNeededUsers);

export default router;
