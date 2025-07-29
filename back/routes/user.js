// routes/user.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

// 註冊
// POST /api/users/register
router.post("/register", async (req, res) => {
	try {
		const { name, email, phone, password } = req.body;

		if (!password || (!email && !phone)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "必須提供密碼與 Email 或手機其中一項",
			});
		}

		const existingUser = await User.findOne({
			$or: [{ email }, { phone }],
		});

		if (existingUser) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "該 Email 或手機已被註冊",
			});
		}

		const newUser = new User({
			name,
			email,
			phone,
			password, // bcrypt 加密會在 model 中自動處理
		});

		await newUser.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "註冊成功",
		});
	} catch (err) {
		console.error(err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "註冊失敗",
		});
	}
});

// 登入
// POST /api/users/login
router.post("/login", async (req, res) => {
	try {
		const { email, phone, password } = req.body;

		const user = await User.findOne(email ? { email } : { phone }).select(
			"+password"
		);

		if (!user) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "找不到帳號",
			});
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "密碼錯誤",
			});
		}

		// 產生 JWT token，裡面包含 userId 和角色（role），有效期限為 3 天
		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "3d" }
		);

		res.status(StatusCodes.OK).json({
			success: true,
			message: "登入成功",
			token,
			user: {
				id: user._id,
				name: user.name,
				role: user.role,
				email: user.email,
				phone: user.phone,
			},
		});
	} catch (err) {
		console.error("❌ 註冊錯誤：", err); // 加這行
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "註冊失敗",
		});
	}
});

export default router;
