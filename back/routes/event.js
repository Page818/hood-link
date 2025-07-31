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

// 取得社區活動清單
router.get("/:communityId", auth, getEventsByCommunity);

// 取得指定活動
router.get("/:id", auth, getEventById);

// 編輯活動
router.put("/:id", auth, updateEvent);

// 刪除活動
router.delete("/:id", auth, deleteEvent);

// 取得活動報名名單及人數
router.get("/participants/:eventId", auth, getEventParticipants);

// 使用者報名活動
router.post("/register/:eventId", auth, registerEvent);

// 使用者取消報名
router.delete("/register/:eventId", auth, cancelRegistration);

export default router;
