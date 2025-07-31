// routes/announcement.js
import express from "express";
import {
	createAnnouncement,
	getAnnouncementsByCommunity,
	updateAnnouncement,
	deleteAnnouncement,
	getAnnouncementById,
} from "../controllers/announcement.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 發布公告路由
router.post("/create", auth, createAnnouncement);

// 取得指定社區的公告清單
router.get("/:communityId", auth, getAnnouncementsByCommunity);

// 編輯公告
router.put("/:id", auth, updateAnnouncement);

// 刪除公告
router.delete("/:id", auth, deleteAnnouncement);

// 取得單一公告
router.get("/:id", auth, getAnnouncementById);

export default router;
