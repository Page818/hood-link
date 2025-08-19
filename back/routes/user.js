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
	updateProfile,
	getMyPosts, // 新增
	getMyReports, // 新增
} from "../controllers/user.js";

const router = express.Router();

// 認證/基本資料
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", auth, getCurrentUser);
router.patch("/update", auth, validateProfileUpdate, updateProfile);

// 我的清單
router.get("/me/posts", auth, getMyPosts);
router.get("/me/reports", auth, getMyReports);

export default router;
