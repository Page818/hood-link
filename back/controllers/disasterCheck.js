// controller/disasterCheck.js
import DisasterCheck from "../models/disasterCheck.js";
import Community from "../models/community.js";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";

// 建立災害緊急回報訊息
export const createDisasterCheck = async (req, res) => {
	try {
		const { message, communityId } = req.body;

		// 必填欄位檢查
		if (!message || !communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供災害訊息內容與社區ID",
			});
		}

		// 驗證社區ID正確且存在
		if (!mongoose.isValidObjectId(communityId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的社區ID",
			});
		}
		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到對應社區",
			});
		}

		// 權限檢查：必須是該社區管理員
		if (
			!community.admins
				.map((id) => id.toString())
				.includes(req.user._id.toString())
		) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "您不是該社區管理員，無法發送災害訊息",
			});
		}

		const newDisaster = new DisasterCheck({
			message,
			community: communityId,
			// responses 預設空，等用戶回覆時才加入
		});

		await newDisaster.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "災害訊息已發送",
			disaster: newDisaster,
		});
	} catch (err) {
		console.error("❌ 發送災害訊息失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法發送災害訊息",
			error: err.message,
		});
	}
};

// 用戶回復
export const replyDisasterCheck = async (req, res) => {
	try {
		// 災害訊息ID
		const { id } = req.params;
		const userId = req.user._id;
		// "我沒事" or "請求幫助"
		const { reply } = req.body;

		if (!["我沒事", "請求幫助"].includes(reply)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "回應內容不正確，只能選擇「我沒事」或「請求幫助」",
			});
		}

		const disaster = await DisasterCheck.findById(id).populate("community");
		if (!disaster) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到此災害訊息",
			});
		}

		// 權限檢查（是否社區成員）
		if (
			!disaster.community.members
				.map((mid) => mid.toString())
				.includes(userId.toString())
		) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你不是本社區成員，無法回覆",
			});
		}

		// 檢查是否已回應，回應過就更新
		const existIdx = disaster.responses.findIndex(
			(r) => r.user.toString() === userId.toString()
		);
		if (existIdx !== -1) {
			disaster.responses[existIdx].reply = reply;
			disaster.responses[existIdx].replyAt = new Date();
		} else {
			disaster.responses.push({
				user: userId,
				reply,
				replyAt: new Date(),
			});
		}

		await disaster.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "回覆成功",
			reply,
		});
	} catch (err) {
		console.error("❌ 回覆災害訊息失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法回覆災害訊息",
			error: err.message,
		});
	}
};
