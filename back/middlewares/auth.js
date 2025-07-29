// middlewares/auth.js
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

// 定義一個 Express middleware，命名為 auth
const auth = (req, res, next) => {
	const authHeader = req.headers.authorization;

	// 檢查是否有 Bearer Token
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "未提供驗證 token",
		});
	}

  // 把 Bearer <token> 拆開，只取 <token> 部分
	const token = authHeader.split(" ")[1];

	try {
		// 驗證 token 並解析
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// 將解碼資訊掛到 req.user 上
		req.user = {
			userId: decoded.userId,
			role: decoded.role,
		};

    //  next() 表示通過驗證，交給下一個 handler 處理請求
    
		next();
	} catch (error) {
		console.error("JWT 驗證失敗：", error);
		res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "驗證失敗，請重新登入",
		});
	}
};

export default auth;
