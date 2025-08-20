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
} from "../controllers/user.js";

const router = express.Router();

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

export default router;
