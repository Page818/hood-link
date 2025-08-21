// controllers/announcement.js
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import Announcement from "../models/announcement.js";
import Community from "../models/community.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);
const oidEq = (a, b) => a?.toString() === b?.toString();

/* ----------------------------- 發佈公告 ----------------------------- */
// 路由對應：POST /api/announcements/create
export const createAnnouncement = async (req, res) => {
	try {
		const { title, content, image, communityId, pinned } = req.body;

		if (!title || !content || !communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供標題、內容與社區 ID",
			});
		}

		// 確認社區存在
		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到對應社區",
			});
		}

		// 僅社區管理員可發佈公告
		const isAdmin = community.admins.some((id) => oidEq(id, req.user._id));
		if (!isAdmin) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限發佈公告",
			});
		}

		// 若要置頂，先取消同社區其他置頂（每社區僅一篇）
		if (pinned) {
			await Announcement.updateMany(
				{ community: toObjectId(communityId), pinned: true },
				{ $set: { pinned: false } } // 注意：若你想更保守，可加上 updatedAt 一起更新
			);
		}

		const newAnnouncement = new Announcement({
			title,
			content,
			image: image || "",
			pinned: !!pinned,
			community: toObjectId(communityId),
			creator: req.user._id,
		});

		await newAnnouncement.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "公告已發佈",
			announcement: newAnnouncement,
		});
	} catch (err) {
		console.error("❌ 發佈公告失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法發佈公告",
			error: err.message,
		});
	}
};

/* ----------------------- 取得社區公告清單 ----------------------- */
// 路由對應：GET /api/announcements/community/:communityId
export const getAnnouncementsByCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;
		if (!communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供社區 ID",
			});
		}

		const announcements = await Announcement.find({
			community: toObjectId(communityId),
		}).sort({ pinned: -1, updatedAt: -1 });

		res.status(StatusCodes.OK).json({
			success: true,
			announcements,
		});
	} catch (err) {
		console.error("❌ 查詢公告失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得公告清單",
			error: err.message,
		});
	}
};

/* ----------------------------- 取得單一公告 ----------------------------- */
// 路由對應：GET /api/announcements/id/:id
export const getAnnouncementById = async (req, res) => {
	try {
		const { id } = req.params;

		const announcement = await Announcement.findById(id).populate(
			"creator",
			"name email"
		);

		if (!announcement) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到這篇公告",
			});
		}

		res.status(StatusCodes.OK).json({
			success: true,
			announcement,
		});
	} catch (err) {
		console.error("❌ 查詢公告失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得公告資料",
			error: err.message,
		});
	}
};

/* ----------------------------- 編輯公告 ----------------------------- */
// 路由對應：PUT /api/announcements/:id
// export const updateAnnouncement = async (req, res) => {
// 	try {
// 		const announcementId = req.params.id;
// 		const { title, content, image, pinned, communityId } = req.body;

// 		if (!title || !content) {
// 			return res
// 				.status(StatusCodes.BAD_REQUEST)
// 				.json({ success: false, message: "請提供標題與內容" });
// 		}

// 		// 找公告（連同社區以便權限判斷）
// 		const announcement =
// 			await Announcement.findById(announcementId).populate("community");
// 		if (!announcement) {
// 			return res
// 				.status(StatusCodes.NOT_FOUND)
// 				.json({ success: false, message: "找不到公告" });
// 		}

// 		// 若前端有傳 communityId，檢查是否一致（避免跨社區誤編）
// 		if (communityId && !oidEq(announcement.community?._id, communityId)) {
// 			return res.status(StatusCodes.FORBIDDEN).json({
// 				success: false,
// 				message: "無權限編輯此公告（社區不符）",
// 			});
// 		}

// 		// 權限：建立者或社區管理員
// 		const isCreator = oidEq(announcement.creator, req.user._id);
// 		const isAdmin = announcement.community?.admins?.some((id) =>
// 			oidEq(id, req.user._id)
// 		);
// 		if (!isCreator && !isAdmin) {
// 			return res.status(StatusCodes.FORBIDDEN).json({
// 				success: false,
// 				message: "你沒有權限修改這篇公告",
// 			});
// 		}
// 		const rawCommunityId =
// 			announcement.community?._id || announcement.community;
// 		const rawAnnouncementId = announcement._id || announcementId;

// 		if (pinned && rawCommunityId && rawAnnouncementId) {
// 			console.log("🟡 準備更新其他公告置頂狀態");
// 			console.log("🧩 社區 ID：", rawCommunityId);
// 			console.log("🧩 當前公告 ID：", rawAnnouncementId);
// 			await Announcement.updateMany(
// 				{
// 					community: toObjectId(rawCommunityId),
// 					pinned: true,
// 					_id: { $ne: announcementId },
// 				},
// 				{ $set: { pinned: false } }
// 			);
// 		}
// 		// 寫回更新
// 		announcement.title = title;
// 		announcement.content = content;
// 		if (image !== undefined) announcement.image = image || "";
// 		if (pinned !== undefined) announcement.pinned = !!pinned;

// 		await announcement.save();

// 		res.status(StatusCodes.OK).json({
// 			success: true,
// 			message: "公告已更新",
// 			announcement,
// 		});
// 	} catch (err) {
// 		console.error("❌ 更新公告失敗", err);
// 		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
// 			success: false,
// 			message: "無法更新公告",
// 			error: err.message,
// 		});
// 	}
// };
// controllers/announcement.js（只需替換 updateAnnouncement 這個函式）
export const updateAnnouncement = async (req, res) => {
	try {
		const announcementId = req.params.id;
		const { title, content, image, pinned, communityId } = req.body;

		if (!title || !content) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: "請提供標題與內容" });
		}

		// 取公告（帶社區，做權限檢查）
		const announcement =
			await Announcement.findById(announcementId).populate("community");
		if (!announcement) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到公告" });
		}

		// （可選）前端若帶 communityId，驗證一致
		if (
			communityId &&
			announcement.community &&
			announcement.community._id.toString() !== String(communityId)
		) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "無權限編輯此公告（社區不符）",
			});
		}

		// 權限：建立者或社區管理員
		const isCreator =
			announcement.creator?.toString() === req.user._id.toString();
		const isAdmin = (announcement.community?.admins || []).some(
			(uid) => uid.toString() === req.user._id.toString()
		);
		if (!isCreator && !isAdmin) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限修改這篇公告",
			});
		}

		// 先更新其它／全部的 pinned（避免 $ne/$nin 對 _id 的轉型問題）
		if (pinned === true) {
			await Announcement.updateMany(
				{ community: announcement.community._id, pinned: true },
				{ $set: { pinned: false } }
			);
		}

		// 寫回本篇
		announcement.title = title;
		announcement.content = content;
		if (image !== undefined) announcement.image = image || "";
		if (pinned !== undefined) announcement.pinned = !!pinned;

		await announcement.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "公告已更新",
			announcement,
		});
	} catch (err) {
		console.error("❌ 更新公告失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法更新公告",
			error: err.message,
		});
	}
};

/* ----------------------------- 刪除公告 ----------------------------- */
// 路由對應：DELETE /api/announcements/:id
export const deleteAnnouncement = async (req, res) => {
	try {
		const { id } = req.params;

		const announcement = await Announcement.findById(id).populate("community");
		if (!announcement) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到公告",
			});
		}

		const isCreator = oidEq(announcement.creator, req.user._id);
		const isAdmin = announcement.community?.admins?.some((a) =>
			oidEq(a, req.user._id)
		);

		if (!isCreator && !isAdmin) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限刪除這篇公告",
			});
		}

		await announcement.deleteOne();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "公告已刪除",
		});
	} catch (err) {
		console.error("❌ 刪除公告失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法刪除公告",
			error: err.message,
		});
	}
};
