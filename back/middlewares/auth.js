// middlewares/auth.js
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import User from "../models/user.js";

/**
 * 驗證使用者身分的中介層
 * - 支援 Authorization: Bearer <token>
 * - 相容舊 token（payload.userId）與新 token（payload._id）
 * - 會把完整使用者文件（不含密碼）掛到 req.user
 */
const auth = async (req, res, next) => {
	// 1) 取出 token
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "未提供驗證 token",
		});
	}
	const token = authHeader.split(" ")[1];

	try {
		// 2) 驗證並解碼
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// 相容：新(_id) 與 舊(userId)
		const decodedId = decoded._id || decoded.userId;
		if (!decodedId) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "無效的 token",
			});
		}

		// 3) 撈取使用者（不含密碼）
		const user = await User.findById(decodedId).select("-password");
		if (!user) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "使用者不存在",
			});
		}

		// 4) 掛到 req.user，後續控制器統一用 req.user._id
		// req.user = user;
		// 4) 掛到 req.user（轉成 plain object 並把 _id 轉字串，避免後續型別不一致）
		const plain = user.toObject ? user.toObject() : user;
		req.user = { ...plain, _id: user._id.toString() };

		// 5) 放行
		next();
	} catch (error) {
		console.error("JWT 驗證失敗：", error);
		return res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "驗證失敗，請重新登入",
		});
	}
};

export default auth;
