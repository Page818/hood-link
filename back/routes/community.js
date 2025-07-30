// routes/community.js
import express from "express";
import {
	createCommunity,
	joinCommunity,
	updateCommunity,
	getMyCommunities,
	getCommunityById,
	getJoinRequests,
	reviewJoinRequest,
} from "../controllers/community.js";

import auth from "../middlewares/auth.js";

const router = express.Router();

// 建立社區
router.post("/create", auth, createCommunity);

// 加入社區
router.post("/join", auth, joinCommunity);

// 修改社區資料
router.patch("/update", auth, updateCommunity);

// 取得目前使用者所屬的社區
router.get("/my", auth, getMyCommunities);

// 取得特定社區詳細資訊
router.get("/:id", auth, getCommunityById);

// 取得加入申請（僅社區管理員）
router.get("/:communityId/join-requests", auth, getJoinRequests);

// 審核加入申請
router.post("/review-join-request", auth, reviewJoinRequest);

export default router;
