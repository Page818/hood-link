// controllers/announcement.js
import Announcement from "../models/announcement.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";

// 發布公告
export const createAnnouncement = async (req, res) => {
	try {
		const { title, content, image, communityId, pinned } = req.body;

		// 檢查必要欄位
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

		// 僅社區建立者可發佈公告（也可改為包含社區管理員）
		// if (community.creator.toString() !== req.user._id.toString()) {
		// 	return res.status(StatusCodes.FORBIDDEN).json({
		// 		success: false,
		// 		message: "你沒有權限發佈公告",
		// 	});
		// }

		// 僅社區管理員可發佈公告
		if (!community.admins.includes(req.user._id)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限發佈公告",
			});
		}

		// 若要置頂，先取消原本已置頂的公告（每個社區只能有一篇置頂）
		if (pinned) {
			await Announcement.updateMany(
				{ community: communityId, pinned: true },
				{ pinned: false }
			);
		}

		const newAnnouncement = new Announcement({
			title,
			content,
			image,
			pinned: !!pinned,
			community: communityId,
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
		});
	}
};

// 取得社區公告清單（依 pinned 與時間排序）
export const getAnnouncementsByCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;

		if (!communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供社區 ID",
			});
		}

		const announcements = await Announcement.find({ community: communityId })
			.sort({ pinned: -1, updatedAt: -1 }) // 先 pinned，再新到舊
			.populate("creator", "name email"); // 可選，顯示發布者資訊

		res.status(StatusCodes.OK).json({
			success: true,
			announcements,
		});
	} catch (err) {
		console.error("❌ 查詢公告失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得公告清單",
		});
	}
};

// 編輯公告
export const updateAnnouncement = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, content, image, pinned } = req.body;

		const announcement = await Announcement.findById(id);
		if (!announcement) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到公告",
			});
		}

		// 僅建立者可修改
		if (announcement.creator.toString() !== req.user._id.toString()) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限修改這篇公告",
			});
		}

		// 若變更為置頂，取消其他已置頂公告
		if (pinned) {
			await Announcement.updateMany(
				{ community: announcement.community, pinned: true, _id: { $ne: id } },
				{ pinned: false }
			);
		}

		// 更新欄位
		if (title) announcement.title = title;
		if (content) announcement.content = content;
		if (image !== undefined) announcement.image = image;
		if (pinned !== undefined) announcement.pinned = pinned;

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
		});
	}
};

// 刪除公告
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

		// 權限判斷：原建立者 或 管理員 才可刪除
		const isCreator =
			announcement.creator.toString() === req.user._id.toString();
		const isAdmin = announcement.community.admins.includes(req.user._id);

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
		});
	}
};

// 取得單一公告
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
		});
	}
};
