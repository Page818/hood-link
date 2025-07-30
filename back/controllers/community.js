// controllers/community.js
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";
import User from "../models/user.js";
import JoinRequest from "../models/joinRequest.js";

// ✅ 建立新社區
export const createCommunity = async (req, res) => {
	try {
		const { name, address, isPublic } = req.body;

		if (!name || !address) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供社區名稱與地址",
			});
		}

		const existing = await Community.findOne({ name });

		if (existing) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "已有相同名稱的社區",
			});
		}

		const newCommunity = new Community({
			name,
			address,
			isPublic: !!isPublic,
			creator: req.user._id,
			members: [req.user._id],
		});

		await newCommunity.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "社區建立成功",
			community: newCommunity,
		});
	} catch (err) {
		console.error("❌ 建立社區失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "建立社區失敗",
		});
	}
};

// ✅ 加入社區（公開直接加入；非公開需審核）
export const joinCommunity = async (req, res) => {
	try {
		const { communityId } = req.body;

		if (!communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供要加入的社區 ID",
			});
		}

		const community = await Community.findById(communityId);
		const user = await User.findById(req.user.userId);

		if (!community || !user) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到社區或使用者",
			});
		}

		// 已是成員
		if (community.members.includes(user._id)) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "你已經是該社區成員",
			});
		}

		// 若為非公開社區，建立申請單（避免重複申請）
		if (!community.isPublic) {
			const existingRequest = await JoinRequest.findOne({
				community: communityId,
				user: user._id,
				status: "pending",
			});

			if (existingRequest) {
				return res.status(StatusCodes.CONFLICT).json({
					success: false,
					message: "你已經申請加入此社區，請等待審核",
				});
			}

			const newRequest = new JoinRequest({
				community: communityId,
				user: user._id,
			});

			await newRequest.save();

			return res.status(StatusCodes.OK).json({
				success: true,
				message: "已送出加入申請，請等待管理員審核",
			});
		}

		// ✅ 公開社區：直接加入
		community.members.push(user._id);
		await community.save();

		// ✅ 更新使用者資料（community 欄位為陣列）
		if (!Array.isArray(user.community)) {
			user.community = [];
		}
		user.community.push(community._id);
		await user.save();

		return res.status(StatusCodes.OK).json({
			success: true,
			message: "成功加入社區",
		});
	} catch (err) {
		console.error("❌ 加入社區錯誤", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "加入社區失敗",
			error: err.message,
		});
	}
};

//  ✅ 更新社區資料
export const updateCommunity = async (req, res) => {
	try {
		const { communityId, name, address, isPublic } = req.body;

		if (!communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供社區 ID",
			});
		}

		const community = await Community.findById(communityId);

		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該社區",
			});
		}

		// 僅允許創建者編輯
		if (community.creator?.toString() !== req.user?._id?.toString()) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限修改這個社區",
			});
		}

		if (name) community.name = name;
		if (address) community.address = address;
		if (isPublic !== undefined) community.isPublic = isPublic;

		await community.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "社區資料已更新",
			community,
		});
	} catch (err) {
		console.error("❌ 更新社區資料失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法更新社區資料",
			error: err.message,
		});
	}
};

// ✅ 取得目前使用者所屬的社區清單
export const getMyCommunities = async (req, res) => {
	try {
		const communities = await Community.find({ members: req.user._id })
			.populate("creator", "name")
			.select("-members");

		res.status(StatusCodes.OK).json({
			success: true,
			communities,
		});
	} catch (err) {
		console.error("❌ 取得使用者社區失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得社區資料",
		});
	}
};

// ✅ 取得單一社區詳細資料
export const getCommunityById = async (req, res) => {
	try {
		const community = await Community.findById(req.params.id).populate(
			"creator",
			"name email"
		);

		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該社區",
			});
		}

		res.status(StatusCodes.OK).json({
			success: true,
			community,
		});
	} catch (err) {
		console.error("❌ 取得社區失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得社區資料",
		});
	}
};
