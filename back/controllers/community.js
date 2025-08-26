import mongoose from "mongoose";
import Community from "../models/community.js";
import User from "../models/user.js";
import JoinRequest from "../models/joinRequest.js";
import { StatusCodes } from "http-status-codes";

/**
 * 建立新社區
 */
export const createCommunity = async (req, res) => {
	try {
		const { name, address, isPublic } = req.body;

		if (!name || !address) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供社區名稱與地址",
			});
		}

		// 避免重複社區
		const existing = await Community.findOne({ name });
		if (existing) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "已有相同名稱的社區",
			});
		}

		// 建立新社區
		const newCommunity = new Community({
			name,
			address,
			isPublic: !!isPublic,
			creator: req.user._id,
			admins: [req.user._id],
			members: [req.user._id],
		});

		await newCommunity.save();

		// 更新使用者的 community 欄位
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到使用者",
			});
		}

		if (!Array.isArray(user.community)) {
			user.community = [];
		}
		if (!user.community.includes(newCommunity._id)) {
			user.community.push(newCommunity._id);
		}

		await user.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "社區建立成功",
			community: newCommunity,
		});
	} catch (err) {
		console.error("❌ 建立社區失敗:", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "建立社區失敗",
		});
	}
};

// 取得使用者在某個社區的狀態
export const getCommunityStatus = async (req, res) => {
	try {
		const { communityId } = req.params;
		const userId = req.user._id; // 由 auth middleware 提供

		if (!mongoose.Types.ObjectId.isValid(communityId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的社區 ID",
			});
		}

		// 先檢查社區是否存在
		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該社區",
			});
		}

		// 判斷使用者是否已是成員
		const isMember = community.members.some(
			(m) => m.toString() === userId.toString()
		);
		if (isMember) {
			return res.status(StatusCodes.OK).json({
				success: true,
				status: "member", // 已加入
			});
		}

		// 判斷是否是管理員
		const isAdmin = community.admins.some(
			(a) => a.toString() === userId.toString()
		);
		if (isAdmin) {
			return res.status(StatusCodes.OK).json({
				success: true,
				status: "admin", // 管理員
			});
		}

		// 檢查是否已送出申請
		const joinRequest = await JoinRequest.findOne({
			community: communityId,
			user: userId,
		});

		if (joinRequest) {
			return res.status(StatusCodes.OK).json({
				success: true,
				status: joinRequest.status, // "pending" | "approved" | "rejected"
			});
		}

		// 如果以上皆不是，回傳尚未申請
		return res.status(StatusCodes.OK).json({
			success: true,
			status: "none", // 尚未申請
		});
	} catch (error) {
		console.error("取得社區狀態失敗:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "伺服器錯誤",
		});
	}
};
/**
 * 加入社區（公開 → 直接加入；非公開 → 建立申請）
 */
export const joinCommunity = async (req, res) => {
	try {
		const { communityId } = req.body;
		const userId = req.user._id;

		if (!communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供要加入的社區 ID",
			});
		}

		if (!mongoose.isValidObjectId(communityId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供有效的社區 ID",
			});
		}

		const community = await Community.findById(communityId);
		const user = await User.findById(userId);

		if (!community || !user) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到社區或使用者",
			});
		}

		// 已是成員
		if (community.members.includes(userId)) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "你已經是該社區成員",
			});
		}

		// **非公開社區 → 建立 JoinRequest**
		if (!community.isPublic) {
			const existingRequest = await JoinRequest.findOne({
				community: communityId,
				user: userId,
				status: "pending",
			});

			if (existingRequest) {
				return res.status(StatusCodes.CONFLICT).json({
					success: false,
					message: "你已經申請加入此社區，請等待審核",
				});
			}

			await JoinRequest.create({
				community: communityId,
				user: userId,
				status: "pending",
			});

			return res.status(StatusCodes.OK).json({
				success: true,
				message: "已送出加入申請，請等待管理員審核",
				joined: false,
			});
		}

		// **公開社區 → 直接加入**
		community.members.push(userId);
		await community.save();

		if (!Array.isArray(user.community)) {
			user.community = [];
		}
		user.community.push(community._id);
		await user.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "成功加入社區",
			joined: true,
		});
	} catch (err) {
		console.error("❌ 加入社區失敗:", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "加入社區失敗",
		});
	}
};

/**
 * 更新社區資料（限管理員）
 */
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

		// 驗證管理員權限
		if (
			!community.admins.some(
				(adminId) => adminId.toString() === req.user._id.toString()
			)
		) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限修改這個社區",
			});
		}

		if (name) community.name = name;
		if (address) community.address = address;
		// if (typeof isPublic === "boolean") community.isPublic = isPublic;
		if (
			typeof isPublic === "boolean" ||
			isPublic === "true" ||
			isPublic === "false"
		) {
			community.isPublic = isPublic === true || isPublic === "true";
		}

		await community.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "社區資料已更新",
			community,
		});
	} catch (err) {
		console.error("❌ 更新社區資料失敗:", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法更新社區資料",
		});
	}
};

/**
 * 取得目前使用者的社區清單
 */
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
		console.error("❌ 取得使用者社區失敗:", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得社區資料",
		});
	}
};

/**
 * 取得單一社區資料
 */
export const getCommunityById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.isValidObjectId(id)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的社區 ID",
			});
		}

		const community = await Community.findById(id).populate(
			"creator",
			"name email"
		);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該社區",
			});
		}

		res.status(StatusCodes.OK).json({ success: true, community });
	} catch (err) {
		console.error("❌ 取得社區資料失敗:", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得社區資料",
		});
	}
};

/**
 * 取得某社區的待審核申請（僅限管理員）
 */
export const getJoinRequests = async (req, res) => {
	try {
		const { communityId } = req.params;

		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到社區",
			});
		}

		// 驗證是否為管理員
		if (!community.admins.includes(req.user._id)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限檢視申請",
			});
		}

		const requests = await JoinRequest.find({
			community: communityId,
			status: "pending",
		}).populate("user", "name email");

		res.status(StatusCodes.OK).json({ success: true, requests });
	} catch (err) {
		console.error("❌ 取得申請清單失敗:", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得申請清單",
		});
	}
};

/**
 * 審核加入申請
 */
export const reviewJoinRequest = async (req, res) => {
	try {
		const { requestId, decision } = req.body;

		const request = await JoinRequest.findById(requestId).populate("community");
		if (!request) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到申請資料",
			});
		}

		const community = request.community;

		// 僅限管理員
		if (!community.admins.includes(req.user._id)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限審核此申請",
			});
		}

		if (!["approved", "rejected"].includes(decision)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供有效的決定（approved 或 rejected）",
			});
		}

		// 更新申請狀態
		request.status = decision;
		await request.save();

		// 如果核准 → 加入成員
		if (decision === "approved") {
			if (!community.members.includes(request.user)) {
				community.members.push(request.user);
				await community.save();
			}

			const user = await User.findById(request.user);
			if (!user.community.includes(community._id)) {
				user.community.push(community._id);
				await user.save();
			}
		}

		res.status(StatusCodes.OK).json({
			success: true,
			message: `申請已${decision === "approved" ? "核准" : "拒絕"}`,
		});
	} catch (err) {
		console.error("❌ 審核申請失敗:", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法審核申請",
		});
	}
};
