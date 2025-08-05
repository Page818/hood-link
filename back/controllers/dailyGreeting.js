// controller/dailyGreeting.js
import DailyGreeting from "../models/dailyGreeting.js";
import Community from "../models/community.js";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import User from "../models/user.js";

// 產生每日問候訊息（手動或自動排程）
export const createDailyGreeting = async (req, res) => {
	try {
		const { communityId, date } = req.body;
		// 假設天氣與提醒直接用固定假字串
		const fakeWeather = "氣溫25~35度，預計晴時多雲，午後有短暫雷陣雨。";
		const greeting = `早安！今天是${date}\n${fakeWeather}\n祝您有個美好的一天😊`;

		if (!communityId || !date) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供社區ID與日期",
			});
		}
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
				message: "您不是該社區管理員，無法發送每日問候",
			});
		}

		// 防呆：同一天同社區只能有一筆
		const exist = await DailyGreeting.findOne({ community: communityId, date });
		if (exist) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "今天已經發送過每日問候囉！",
			});
		}

		const newGreeting = new DailyGreeting({
			message: greeting,
			community: communityId,
			date,
		});

		await newGreeting.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "每日問候已建立！",
			dailyGreeting: newGreeting,
		});
	} catch (err) {
		console.error("❌ 建立每日問候失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法建立每日問候",
			error: err.message,
		});
	}
};

// 用戶回覆
export const replyDailyGreeting = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;
		const { reply } = req.body;

		if (!["美好的一天", "需要幫助"].includes(reply)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "回應內容不正確",
			});
		}

		const greeting = await DailyGreeting.findById(id).populate("community");
		if (!greeting) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到該每日問候訊息",
			});
		}

		// 權限檢查（是否社區成員）
		if (
			!greeting.community.members
				.map((mid) => mid.toString())
				.includes(userId.toString())
		) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你不是本社區成員，無法回覆",
			});
		}

		// 檢查是否已回應
		const existIdx = greeting.responses.findIndex(
			(r) => r.user.toString() === userId.toString()
		);
		if (existIdx !== -1) {
			greeting.responses[existIdx].reply = reply;
			greeting.responses[existIdx].replyAt = new Date();
		} else {
			greeting.responses.push({
				user: userId,
				reply,
				replyAt: new Date(),
			});
		}

		await greeting.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "回覆成功",
			reply,
		});
	} catch (err) {
		console.error("❌ 回覆每日問候失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法回覆每日問候",
			error: err.message,
		});
	}
};

// 查詢多天未回覆名單
export const getUnrepliedUsers = async (req, res) => {
	try {
		const { communityId, startDate, endDate } = req.query;
		if (!communityId || !startDate || !endDate) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供 communityId, startDate, endDate",
			});
		}

		// 找出這幾天所有 DailyGreeting
		const greetings = await DailyGreeting.find({
			community: communityId,
			date: { $gte: startDate, $lte: endDate },
		});

		if (!greetings.length) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "指定日期區間沒有每日問候記錄",
			});
		}

		// 查出所有成員
		const community = await Community.findById(communityId);
		const memberIds = community.members.map((id) => id.toString());

		// 統計：每個用戶在每一天是否有回覆
		const userDailyStatus = {};
		memberIds.forEach((uid) => (userDailyStatus[uid] = []));

		greetings.forEach((greeting) => {
			const repliedUserIds = greeting.responses.map((r) => r.user.toString());
			memberIds.forEach((uid) => {
				userDailyStatus[uid].push(repliedUserIds.includes(uid));
			});
		});

		// 統計未回覆天數
		const result = [];
		for (const uid in userDailyStatus) {
			const unrepliedDays = userDailyStatus[uid].filter(
				(status) => !status
			).length;
			if (unrepliedDays > 0) {
				result.push({
					userId: uid,
					unrepliedDays,
				});
			}
		}

		// 可選：populate user name
		const users = await User.find({
			_id: { $in: result.map((r) => r.userId) },
		}).select("name phone");
		const resultWithName = result.map((r) => {
			const user = users.find((u) => u._id.toString() === r.userId);
			return {
				...r,
				name: user ? user.name : "",
				phone: user ? user.phone : "",
			};
		});

		res.status(StatusCodes.OK).json({
			success: true,
			data: resultWithName,
		});
	} catch (err) {
		console.error("❌ 查詢多天未回覆名單失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "查詢失敗",
			error: err.message,
		});
	}
};

// 查詢多天回覆需要幫助的名單
export const getHelpNeededUsers = async (req, res) => {
	try {
		const { communityId, startDate, endDate } = req.query;
		if (!communityId || !startDate || !endDate) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供 communityId, startDate, endDate",
			});
		}

		// 查詢日期區間所有每日問候
		const greetings = await DailyGreeting.find({
			community: communityId,
			date: { $gte: startDate, $lte: endDate },
		});

		// 收集所有有回覆需要幫助的人
		const helpUsersMap = {};
		greetings.forEach((greeting) => {
			greeting.responses
				.filter((r) => r.reply === "需要幫助QQ")
				.forEach((r) => {
					if (!helpUsersMap[r.user.toString()]) {
						helpUsersMap[r.user.toString()] = [];
					}
					helpUsersMap[r.user.toString()].push({
						date: greeting.date,
						replyAt: r.replyAt,
					});
				});
		});

		// 整理資料
		const userIds = Object.keys(helpUsersMap);
		const users = await User.find({ _id: { $in: userIds } }).select(
			"name phone"
		);
		const result = userIds.map((uid) => {
			const user = users.find((u) => u._id.toString() === uid);
			return {
				userId: uid,
				name: user ? user.name : "",
				phone: user ? user.phone : "",
				helpDates: helpUsersMap[uid], // 哪幾天有回報
				count: helpUsersMap[uid].length,
			};
		});

		res.status(StatusCodes.OK).json({
			success: true,
			data: result,
		});
	} catch (err) {
		console.error("❌ 查詢多天需要幫助名單失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "查詢失敗",
			error: err.message,
		});
	}
};
