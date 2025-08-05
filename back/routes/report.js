// routes/post.js

import express from "express";
import {
	createReport,
	getMyReports,
	getCommunityReports,
} from "../controllers/report.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 建立回報
router.post("/create", auth, createReport);

// 查詢自己回報紀錄
router.get("/my", auth, getMyReports);

// 管理員查該社區全部
router.get("/community/:communityId", auth, getCommunityReports);
