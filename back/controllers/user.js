//controllers/user.js

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";

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
			password,
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

// POST /api/users/login
export const login = async (req, res) => {
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

// GET /api/users/me
export const getCurrentUser = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId)
			.populate("community", "name")
			.select("-password");
		if (!user) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到使用者",
			});
		}

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

		const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, {
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
