// controllers/userSearch.js
import User from "../models/user.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const normalizePhone = (q) => q.replace(/[^\d]/g, ""); // 去掉非數字（台灣手機 09… 之類）

export const searchUsers = async (req, res) => {
	try {
		const { q = "", communityId } = req.query;
		const keyword = String(q || "").trim();

		if (!keyword) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供搜尋關鍵字",
			});
		}

		// 可選：若前端用於社區成員管理，限制只有該社區管理員可查
		let excludeIds = [];
		if (communityId && mongoose.isValidObjectId(communityId)) {
			const c = await Community.findById(communityId).select("members admins");
			if (!c) {
				return res
					.status(StatusCodes.NOT_FOUND)
					.json({ success: false, message: "找不到社區" });
			}
			// 不是管理員就擋
			const isAdmin = (c.admins || []).some(
				(a) => String(a) === String(req.user._id)
			);
			if (!isAdmin) {
				return res
					.status(StatusCodes.FORBIDDEN)
					.json({ success: false, message: "沒有權限搜尋此社區成員" });
			}
			// 排除已在社區的成員
			excludeIds = (c.members || []).map((m) => String(m));
		}

		// 建立查詢條件：
		// - 若全數字：當成手機（允許前綴模糊）
		// - 若含非數字或短字串：lineId/name/email 模糊
		const conds = [];
		const phoneDigits = normalizePhone(keyword);
		if (phoneDigits.length >= 4) {
			conds.push({ phone: new RegExp(phoneDigits + "$") }); // 後 4 碼匹配
			conds.push({ phone: new RegExp("^" + phoneDigits) }); // 前綴匹配
		}

		// LINE ID / name / email 模糊（不分大小寫）
		const safeRegex = new RegExp(
			keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
			"i"
		);
		conds.push({ lineId: safeRegex });
		conds.push({ name: safeRegex });
		conds.push({ email: safeRegex });

		const query = { $or: conds };

		// 查詢、過濾掉自己與已在社區成員（若有）
		const users = await User.find(query)
			.limit(20)
			.select("_id name email phone lineId")
			.lean();

		const filtered = users.filter(
			(u) =>
				String(u._id) !== String(req.user._id) &&
				!excludeIds.includes(String(u._id))
		);

		res.status(StatusCodes.OK).json({
			success: true,
			results: filtered,
		});
	} catch (err) {
		console.error("❌ 搜尋使用者失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "搜尋失敗",
			error: err.message,
		});
	}
};
