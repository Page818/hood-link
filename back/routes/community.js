// routes/community.js
import express from "express";
import { StatusCodes } from "http-status-codes";
import Community from "../models/community.js";
import User from "../models/user.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 建立社區：POST /api/communities/create
//  auth middleware：只有登入使用者才能建立社區
router.post("/create", auth, async (req, res) => {
	try {
		const { name } = req.body;

		// 驗證輸入
		if (!name || name.trim() === "") {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請輸入社區名稱",
			});
		}

		// 檢查是否已存在同名社區
		const existing = await Community.findOne({ name });
		if (existing) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "已有相同名稱的社區",
			});
		}

		// 建立社區並把創建者加入 members
		const community = new Community({
			name,
			creator: req.user.userId,
			members: [req.user.userId],
		});
		await community.save();

		// 更新使用者資料：設為 admin 並加入社區
		await User.findByIdAndUpdate(req.user.userId, {
			role: "admin",
			community: community._id,
		});

		//  回應前端
		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "社區建立成功",
			community,
		});
	} catch (err) {
		console.error("建立社區錯誤：", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "建立社區失敗",
		});
	}
});

// 加入社區：POST /api/communities/join/:id
// POST API 路徑為 /join/:id，其中 :id 為社區 _id
// auth middleware：只有登入者能加入社區
router.post("/join/:id", auth, async (req, res) => {
	try {
		const community = await Community.findById(req.params.id);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該社區",
			});
		}

		// 將使用者加入社區成員陣列（避免重複加入）
		if (!community.members.includes(req.user.userId)) {
			community.members.push(req.user.userId);
			await community.save();
		}

		// 更新使用者所屬社區
		await User.findByIdAndUpdate(req.user.userId, {
			community: community._id,
		});

		res.status(StatusCodes.OK).json({
			success: true,
			message: "加入社區成功",
			communityId: community._id,
		});
	} catch (err) {
		console.error("加入社區錯誤：", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "加入社區失敗",
		});
	}
});

export default router;
