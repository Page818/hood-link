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

// 發布公告
router.post("/create", auth, createAnnouncement);

// 取得指定社區的公告清單
router.get("/community/:communityId", auth, getAnnouncementsByCommunity);

// 取得單一公告
router.get("/id/:id", auth, getAnnouncementById);

// 編輯公告
router.put("/:id", auth, updateAnnouncement);

// 刪除公告
router.delete("/:id", auth, deleteAnnouncement);

export default router;
