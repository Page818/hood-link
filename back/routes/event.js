//routes/event.js
import express from "express";
import {
	createEvent,
	getEventsByCommunity,
	getEventById,
	updateEvent,
	deleteEvent,
	getEventParticipants,
	registerEvent,
	cancelRegistration,
} from "../controllers/event.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 建立活動
router.post("/create", auth, createEvent);

// ✅ 取得某社區活動清單（明確指定 community）
router.get("/community/:communityId", auth, getEventsByCommunity);

// ✅ 查單一活動
router.get("/id/:id", auth, getEventById);

// 編輯／刪除活動
router.put("/:id", auth, updateEvent);
router.delete("/:id", auth, deleteEvent);

// 活動報名名單與報名功能
router.get("/participants/:eventId", auth, getEventParticipants);
router.post("/register/:eventId", auth, registerEvent);
router.delete("/register/:eventId", auth, cancelRegistration);

export default router;
