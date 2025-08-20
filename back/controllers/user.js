// controllers/user.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";
import Post from "../models/post.js";
import Report from "../models/report.js";

/* --------------------------------- Helpers -------------------------------- */
const shapeUser = (u) => ({
	id: u._id,
	name: u.name,
	email: u.email,
	phone: u.phone,
	role: u.role,
	lineId: u.lineId,
	isElder: !!u.isElder,
	isLivingAlone: !!u.isLivingAlone,
	receiveDailyCheck: !!u.receiveDailyCheck,
	receiveDisasterCheck: !!u.receiveDisasterCheck,
	community: u.community,
});

const sanitizeCategory = (v) =>
	typeof v === "string" && v.trim() ? v : "其他";

/** 將 Post/Report 做安全清洗，避免前端讀取到 undefined.category  */
const shapeItem = (doc) => {
	const obj = doc.toObject ? doc.toObject() : doc;
	return {
		...obj,
		category: sanitizeCategory(obj.category),
		community:
			obj.community && typeof obj.community === "object"
				? { _id: obj.community._id, name: obj.community.name }
				: obj.community || null,
	};
};

/* 允許更新的欄位（白名單） */
const ALLOWED_FIELDS = [
	"name",
	"email",
	"phone",
	"lineId",
	"isElder",
	"isLivingAlone",
	"receiveDailyCheck",
	"receiveDisasterCheck",
	"password", // 有提供才會處理
];

/** 建立更新 payload（只取白名單欄位 & 處理密碼雜湊） */
const buildUpdatePayload = async (body = {}) => {
	const payload = {};
	for (const k of ALLOWED_FIELDS) {
		if (Object.prototype.hasOwnProperty.call(body, k)) {
			payload[k] = body[k];
		}
	}
	// 空密碼不更新；有值才 hash
	if (payload.password) {
		const salt = await bcrypt.genSalt(10);
		payload.password = await bcrypt.hash(payload.password, salt);
	} else {
		delete payload.password;
	}
	return payload;
};

/* -------------------------------- Register -------------------------------- */
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

		// 動態唯一性檢查（註冊保留）
		const or = [];
		if (email) or.push({ email });
		if (phone) or.push({ phone });

		if (or.length === 0) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供 Email 或手機號碼",
			});
		}

		const existingUser = await User.findOne({ $or: or });
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
			password, // 假設你的 User schema 有 pre('save') 自動 hash；若無也會在 login 比對失敗
			lineId,
			isElder: !!isElder,
			isLivingAlone: !!isLivingAlone,
			receiveDailyCheck: !!receiveDailyCheck,
			receiveDisasterCheck: !!receiveDisasterCheck,
		});

		await newUser.save();

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

/* ---------------------------------- Login --------------------------------- */
// POST /api/users/login
export const login = async (req, res) => {
	try {
		const { account, password } = req.body;

		let query = {};
		if (/^\d{10}$/.test(account)) {
			query.phone = account;
		} else {
			query.email = account;
		}

		const user = await User.findOne(query).select("+password");
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

		const token = jwt.sign(
			{ _id: user._id, role: user.role },
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
				email: user.email,
				phone: user.phone,
				role: user.role,
			},
		});
	} catch (err) {
		console.error("❌ 登入錯誤：", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "登入失敗",
		});
	}
};

/* ------------------------------ Get /api/users/me ------------------------- */
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
		res.json({
			success: true,
			user: shapeUser(user),
		});
	} catch (err) {
		console.error("❌ 取得使用者資料錯誤：", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "取得使用者資料失敗",
		});
	}
};

/* ------------------------------ Update Profile ---------------------------- */
/**
 * 採「直接更新」：不做 exists 預檢，避免 _id: {$ne: …} CastError。
 * 撞到唯一索引 → 由 11000 捕捉並回 400；schema 驗證錯誤回 400。
 */

// 舊路由相容：PATCH /api/users/update
export const updateProfile = async (req, res) => {
	try {
		const payload = await buildUpdatePayload(req.body);

		const updated = await User.findByIdAndUpdate(
			req.user._id,
			{ $set: payload },
			{ new: true, runValidators: true, context: "query" }
		)
			.populate("community", "name admins")
			.select("-password");

		if (!updated) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到使用者" });
		}

		return res.json({
			success: true,
			message: "個人資料更新成功",
			user: shapeUser(updated),
		});
	} catch (err) {
		console.error("❌ 更新 /users/update 錯誤：", {
			name: err?.name,
			code: err?.code,
			message: err?.message,
			errors: err?.errors,
			keyValue: err?.keyValue,
		});

		if (err?.code === 11000) {
			const field = Object.keys(err.keyValue || {})[0] || "欄位";
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: `${field} 已被使用` });
		}

		if (err?.name === "ValidationError") {
			const details = Object.values(err.errors || {})
				.map((e) => e.message)
				.join("; ");
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: details || "欄位格式不正確" });
		}

		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: "更新失敗" });
	}
};

// 新路由（建議）：PATCH /api/users/me
export const updateCurrentUser = async (req, res) => {
	console.log("➡️ updateCurrentUser payload:", req.body, "by", req.user?._id);
	try {
		const payload = await buildUpdatePayload(req.body);

		const updated = await User.findByIdAndUpdate(
			req.user._id,
			{ $set: payload },
			{ new: true, runValidators: true, context: "query" }
		)
			.populate("community", "name admins")
			.select("-password");

		if (!updated) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到使用者" });
		}

		return res.json({
			success: true,
			user: shapeUser(updated),
		});
	} catch (err) {
		console.error("❌ 更新 /me 錯誤：", {
			name: err?.name,
			code: err?.code,
			message: err?.message,
			errors: err?.errors,
			keyValue: err?.keyValue,
		});

		if (err?.code === 11000) {
			const field = Object.keys(err.keyValue || {})[0] || "欄位";
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: `${field} 已被使用` });
		}

		if (err?.name === "ValidationError") {
			const details = Object.values(err.errors || {})
				.map((e) => e.message)
				.join("; ");
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: details || "欄位格式不正確" });
		}

		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: "更新失敗" });
	}
};

/* --------------------------- GET /api/users/me/posts ---------------------- */
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
				.populate("community", "name")
				.lean(),
			Post.countDocuments({ creator: req.user._id }),
		]);

		const safeItems = items.map(shapeItem);

		res.json({
			success: true,
			items: safeItems,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (err) {
		console.error("❌ 取得我的貼文失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得我的貼文",
		});
	}
};

/* -------------------------- GET /api/users/me/reports --------------------- */
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
				.populate("community", "name")
				.lean(),
			Report.countDocuments({ creator: req.user._id }),
		]);

		const safeItems = items.map(shapeItem);

		res.json({
			success: true,
			items: safeItems,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		});
	} catch (err) {
		console.error("❌ 取得我的回報失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得我的回報",
		});
	}
};
