// routes/user.js
import express from "express";
import auth from "../middlewares/auth.js";
import { validateLogin } from "../middlewares/validateLogin.js";
import { validateRegister } from "../middlewares/validateRegister.js";
import { validateProfileUpdate } from "../middlewares/validateProfileUpdate.js";

import {
	register,
	login,
	getCurrentUser,
	updateProfile, // 舊：PATCH /users/update（保留相容）
	updateCurrentUser, // 新：PATCH /users/me（建議使用）
	getMyPosts,
	getMyReports,
	checkAvailability,
} from "../controllers/user.js";
import { searchUsers } from "../controllers/userSearch.js";

const router = express.Router();

// 註冊時取得資料比對
router.get("/check", checkAvailability);

// 認證/基本資料
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", auth, getCurrentUser);

// ✅ 新增語義化更新路由（建議前端改用這條）
router.patch("/me", auth, validateProfileUpdate, updateCurrentUser);

// 仍保留舊路由，避免前端尚未改動造成斷線
router.patch("/update", auth, validateProfileUpdate, updateProfile);

// 我的清單
router.get("/me/posts", auth, getMyPosts);
router.get("/me/reports", auth, getMyReports);

// ★使用者搜尋（手機/LINE ID/姓名/Email）
router.get("/search", auth, searchUsers);

export default router;
