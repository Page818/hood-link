// controllers/event.js

import Event from "../models/event.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";

// 建立活動
export const createEvent = async (req, res) => {
	try {
		const { title, date, content, image, communityId, registrationDeadline } =
			req.body;

		if (!title || !date || !content || !communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供活動標題、日期、內容與社區 ID",
			});
		}

		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到對應社區",
			});
		}

		// 僅限社區管理員可建立活動
		if (!community.admins.includes(req.user._id)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限建立活動",
			});
		}

		const newEvent = new Event({
			title,
			date,
			registrationDeadline,
			content,
			image,
			community: communityId,
			creator: req.user._id,
			participants: [],
		});

		await newEvent.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "活動已建立",
			event: newEvent,
		});
	} catch (err) {
		console.error("❌ 建立活動失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "建立活動失敗",
		});
	}
};

// 取得社區活動清單
export const getEventsByCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;

		if (!communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供社區 ID",
			});
		}
		const events = await Event.find({ community: communityId }).sort({
			registrationDeadline: -1,
			date: -1,
		});

		res.status(StatusCodes.OK).json({
			success: true,
			events,
		});
	} catch (err) {
		console.error("❌ 取得社區活動清單失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "取得社區活動清單失敗",
		});
	}
};

// 取得指定活動
export const getEventById = async (req, res) => {
	try {
		const { id } = req.params;

		const event = await Event.findById(id)
			.populate("community", "name")
			.populate("participants", "name");

		if (!event) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該活動",
			});
		}

		res.status(StatusCodes.OK).json({
			success: true,
			event,
		});
	} catch (err) {
		console.error("❌ 查詢活動失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得活動資訊",
		});
	}
};
// 編輯活動
export const updateEvent = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, date, content, image, registrationDeadline } = req.body;

		const event = await Event.findById(id).populate("community");
		if (!event) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到活動",
			});
		}

		const isCreator = event.creator.toString() === req.user._id.toString();
		const isAdmin = event.community.admins.includes(req.user._id);

		if (!isCreator && !isAdmin) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限編輯此活動",
			});
		}
		if (title) event.title = title;
		if (date) event.date = date;
		if (content) event.content = content;
		if (image) event.image = image;
		if (registrationDeadline) event.registrationDeadline = registrationDeadline;

		await event.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "活動已更新",
			event,
		});
	} catch (err) {
		console.error("❌ 更新活動失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法更新活動",
		});
	}
};

// 刪除活動
export const deleteEvent = async (req, res) => {
	try {
		const { id } = req.params;

		const event = await Event.findById(id).populate("community");

		if (!event) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到活動",
			});
		}
		const isCreator = event.creator.toString() === req.user._id.toString();
		const isAdmin = event.community.admins.includes(req.user._id);

		if (!isCreator && !isAdmin) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限刪除此活動",
			});
		}

		await event.deleteOne();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "活動已刪除",
		});
	} catch (err) {
		console.error("❌ 刪除活動失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法刪除活動",
		});
	}
};

// 取得活動報名名單與人數
export const getEventParticipants = async (req, res) => {
	try {
		const { eventId } = req.params;

		const event = await Event.findById(eventId).populate([
			{
				path: "participants",
				select: "name phone email", // 可視需求擴充
			},
			{
				path: "community",
				select: "admins",
			},
		]);

		if (!event) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到活動",
			});
		}

		const isCreator = event.creator.toString() === req.user._id.toString();
		const isAdmin = event.community.admins.includes(req.user._id);

		if (!isCreator && !isAdmin) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限查看報名名單",
			});
		}

		res.status(StatusCodes.OK).json({
			success: true,
			count: event.participants.length,
			participants: event.participants,
		});
	} catch (err) {
		console.error("❌ 查詢報名名單失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法查詢報名名單",
			error: err.message,
		});
	}
};

// 使用者活動報名
export const registerEvent = async (req, res) => {
	try {
		const { eventId } = req.params;
		const userId = req.user._id;

		const event = await Event.findById(eventId);

		if (!event) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該活動",
			});
		}

		// 若有報名截止時間，檢查是否已超過
		if (event.registrationDeadline && new Date() > event.registrationDeadline) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "報名已截止",
			});
		}

		// 避免重複報名
		if (event.participants.includes(userId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "你已經報名過此活動",
			});
		}

		event.participants.push(userId);
		await event.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "報名成功",
		});
	} catch (err) {
		console.error("❌ 報名活動失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法報名活動",
			error: err.message,
		});
	}
};

// 使用者取消報名
export const cancelRegistration = async (req, res) => {
	try {
		const { eventId } = req.params;
		const userId = req.user._id;

		const event = await Event.findById(eventId);

		if (!event) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該活動",
			});
		}

		// 檢查是否已報名
		if (!event.participants.includes(userId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "你尚未報名此活動",
			});
		}

		// 從陣列中移除該使用者
		event.participants = event.participants.filter(
			(participant) => participant.toString() !== userId.toString()
		);
		await event.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "已取消報名",
		});
	} catch (err) {
		console.error("❌ 取消報名失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取消報名",
			error: err.message,
		});
	}
};
