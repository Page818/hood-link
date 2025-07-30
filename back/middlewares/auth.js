import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import User from "../models/user.js";

const auth = async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "未提供驗證 token",
		});
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// 從資料庫撈出使用者資料
		const user = await User.findById(decoded.userId);

		if (!user) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "使用者不存在",
			});
		}

		req.user = user; // ✅ 掛上完整 User 資料（包含 _id、role 等）

		next(); // ✅ 通過驗證，繼續往下走
	} catch (error) {
		console.error("JWT 驗證失敗：", error);
		res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "驗證失敗，請重新登入",
		});
	}
};

export default auth;
