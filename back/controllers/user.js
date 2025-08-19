//controllers/user.js

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";
import Post from "../models/post.js";
import Report from "../models/report.js";

// POST /api/users/register
export const register = async (req, res) => {
	try {
		const {
			name,
			email,
			phone,
			password,
			isElder,
			lineId,
			isLivingAlone,
			receiveDailyCheck,
			receiveDisasterCheck,
		} = req.body;

		if (!password || (!email && !phone)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "必須提供密碼與 Email 或手機其中一項",
			});
		}

		// 動態建立查詢條件，只加有傳的欄位
		const query = [];
		if (email) query.push({ email });
		if (phone) query.push({ phone });

		if (query.length > 0) {
			const existingUser = await User.findOne({ $or: query });
			if (existingUser) {
				return res.status(StatusCodes.CONFLICT).json({
					success: false,
					message: "該 Email 或手機已被註冊",
				});
			}
		} else {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供 Email 或手機號碼",
			});
		}

		const newUser = new User({
			name,
			email,
			phone,
			password,
			lineId,
			isElder: !!isElder,
			isLivingAlone: !!isLivingAlone,
			receiveDailyCheck: !!receiveDailyCheck,
			receiveDisasterCheck: !!receiveDisasterCheck,
		});

		await newUser.save();
		console.log(newUser.password);

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "註冊成功",
			user: {
				id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				phone: newUser.phone,
				role: newUser.role,
			},
		});
	} catch (err) {
		console.error("❌ 註冊錯誤：", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "註冊失敗",
		});
	}
};

// POST /api/users/login
export const login = async (req, res) => {
	try {
		const { account, password } = req.body;

		// 格式已經在中介層驗證過了，這裡可以放心用
		let query = {};
		if (/^\d{10}$/.test(account)) {
			query.phone = account;
		} else {
			query.email = account;
		}
		console.log("⚠️ 登入接收帳號密碼：", account, password);

		const user = await User.findOne(query).select("+password");
		console.log("🔍 查到的使用者：", user);

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "找不到帳號",
			});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "密碼錯誤",
			});
		}

		const token = jwt.sign(
			{ _id: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "3d" }
		);

		res.status(200).json({
			success: true,
			message: "登入成功",
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role,
			},
		});
	} catch (err) {
		console.error("❌ 登入錯誤：", err);
		res.status(500).json({
			success: false,
			message: "登入失敗",
		});
	}
};

// GET /api/users/me
export const getCurrentUser = async (req, res) => {
	try {
		const user = await User.findById(req.user._id)
			.select("-password")
			.populate("community", "name admins");
		if (!user) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到使用者",
			});
		}
		console.log("✅ /me 成功，req.user =", req.user);
		console.log("✅ decoded 使用者：", req.user);
		res.json({
			success: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role,
				lineId: user.lineId,
				isElder: user.isElder,
				isLivingAlone: user.isLivingAlone,
				receiveDailyCheck: user.receiveDailyCheck,
				receiveDisasterCheck: user.receiveDisasterCheck,
				community: user.community,
			},
		});
	} catch (err) {
		console.error("❌ 取得使用者資料錯誤：", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "取得使用者資料失敗",
		});
	}
};

// PATCH /api/users/update
export const updateProfile = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"email",
			"phone",
			"lineId",
			"isElder",
			"isLivingAlone",
			"receiveDailyCheck",
			"receiveDisasterCheck",
		];

		const updates = {};
		allowedFields.forEach((field) => {
			if (req.body.hasOwnProperty(field)) {
				updates[field] = req.body[field];
			}
		});

		const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
			new: true,
			runValidators: true,
		});

		if (!updatedUser) {
			return res.status(404).json({
				success: false,
				message: "找不到使用者",
			});
		}

		res.json({
			success: true,
			message: "個人資料更新成功",
			user: {
				id: updatedUser._id,
				name: updatedUser.name,
				email: updatedUser.email,
				phone: updatedUser.phone,
				isElder: updatedUser.isElder,
				isLivingAlone: updatedUser.isLivingAlone,
				receiveDailyCheck: updatedUser.receiveDailyCheck,
				receiveDisasterCheck: updatedUser.receiveDisasterCheck,
			},
		});
	} catch (err) {
		console.error("❌ 更新個人資料錯誤：", err);
		res.status(500).json({
			success: false,
			message: "更新失敗",
		});
	}
};

// GET /api/users/me/posts
export const getMyPosts = async (req, res) => {
	try {
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			Post.find({ creator: req.user._id })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("community", "name"),
			Post.countDocuments({ creator: req.user._id }),
		]);

		res.json({
			success: true,
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (err) {
		console.error("❌ 取得我的貼文失敗", err);
		res.status(500).json({ success: false, message: "無法取得我的貼文" });
	}
};
// GET /api/users/me/reports
export const getMyReports = async (req, res) => {
	try {
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			Report.find({ creator: req.user._id })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("community", "name"),
			Report.countDocuments({ creator: req.user._id }),
		]);

		res.json({
			success: true,
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (err) {
		console.error("❌ 取得我的回報失敗", err);
		res.status(500).json({ success: false, message: "無法取得我的回報" });
	}
};
