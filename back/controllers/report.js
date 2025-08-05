// controller/report.js
import Report from "../models/report.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

// 建立回報
export const createReport = async (req, res) => {
	try {
		const { title, description, category, communityId, image, location } =
			req.body;

		// 檢查必要欄位
		if (!title || !description || !category || !communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供標題、描述、類別與社區 ID",
			});
		}

		// 檢查社區 & 格式

		if (!mongoose.isValidObjectId(communityId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的社區 ID",
			});
		}
		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到對應社區",
			});
		}

		const newReport = new Report({
			title,
			description,
			category,
			image,
			location,
			status: "待處理",
			community: communityId,
			creator: req.user._id,
		});

		await newReport.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "回報成功",
			report: newReport,
		});
	} catch (err) {
		console.error("❌ 回報失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法回報",
			error: err.message, // 除錯用，上線時可拿掉
		});
	}
};

// 查自己所有回報
export const getMyReports = async (req, res) => {
	try {
		const reports = await Report.find({ creator: req.user._id })
			.populate("community", "name")
			.sort({ createdAt: -1 }); // 最新的在前

		res.status(200).json({
			success: true,
			reports,
		});
	} catch (err) {
		console.error("❌ 查自己回報失敗", err);
		res.status(500).json({
			success: false,
			message: "無法取得自己的回報",
			error: err.message,
		});
	}
};

// 管理員查詢社區所有回報
export const getCommunityReports = async (req, res) => {
	try {
		const { communityId } = req.params;

		// 檢查社區ID格式
		if (!mongoose.isValidObjectId(communityId)) {
			return res.status(400).json({
				success: false,
				message: "無效的社區 ID",
			});
		}

		// 確認社區存在
		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(404).json({
				success: false,
				message: "找不到該社區",
			});
		}

		// 權限判斷（判斷是否為該社區管理員）
		if (!community.admins.includes(req.user._id)) {
			return res.status(403).json({
				success: false,
				message: "您沒有權限查詢此社區的回報",
			});
		}

		// 查詢社區全部回報
		const reports = await Report.find({ community: communityId })
			.populate("creator", "name")
			.sort({
				status: 1,
				createdAt: -1,
			});

		res.status(200).json({
			success: true,
			reports,
		});
	} catch (err) {
		console.error("❌ 查社區回報失敗", err);
		res.status(500).json({
			success: false,
			message: "無法取得社區回報",
			error: err.message,
		});
	}
};
