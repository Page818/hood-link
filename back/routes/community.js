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
import {
	listMembers,
	addMember,
	removeMember,
	addAdmin,
	removeAdmin,
} from "../controllers/members.js";

import auth from "../middlewares/auth.js";

const router = express.Router();

/** ==================== 基本社區操作 ==================== */
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

/** ==================== 申請審核（僅管理員） ==================== */

// 取得加入申請（僅社區管理員）
router.get("/:communityId/join-requests", auth, getJoinRequests);

// 審核加入申請
router.post("/review-join-request", auth, reviewJoinRequest);

/** ==================== 成員管理（僅管理員） ==================== */

// 成員 + 管理員列表
router.get("/:communityId/members", auth, listMembers);

// 加成員
router.patch("/:communityId/members/add", auth, addMember);

// 移除成員
router.patch("/:communityId/members/remove", auth, removeMember);

// 指派管理員
router.patch("/:communityId/admins/add", auth, addAdmin);

// 取消管理員
router.patch("/:communityId/admins/remove", auth, removeAdmin);

export default router;
