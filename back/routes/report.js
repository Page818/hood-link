// routes/report.js

import express from "express";
import {
	createReport,
	getMyReports,
	getCommunityReports,
	getReportById,
	updateReportStatus,
	deleteReport,
} from "../controllers/report.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 建立回報
router.post("/create", auth, createReport);

// 查詢自己回報紀錄
router.get("/my", auth, getMyReports);

// 管理員查該社區全部
router.get("/community/:communityId", auth, getCommunityReports);

// 查單一回報
router.get("/:id", auth, getReportById);

// 管理員改狀態
router.patch("/:id/status", auth, updateReportStatus);

// 刪除回報
router.delete("/:id", auth, deleteReport);

export default router;
