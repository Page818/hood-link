// controllers/post.js

import Post from "../models/post.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";

// 建立貼文
export const createPost = async (req, res) => {
	try {
		const { title, content, image, category, communityId } = req.body;

		// 檢查必要欄位
		if (!title || !content || !communityId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請提供標題、內容與社區 ID",
			});
		}

		// 檢查社區是否存在
		const community = await Community.findById(communityId);
		if (!community) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到對應社區",
			});
		}

		// 建立貼文
		const newPost = new Post({
			title,
			content,
			image,
			category,
			community: communityId,
			creator: req.user._id,
			comments: [],
		});

		await newPost.save();

		res.status(StatusCodes.CREATED).json({
			success: true,
			message: "貼文已建立",
			post: newPost,
		});
	} catch (err) {
		console.error("❌ 建立貼文失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法建立貼文",
		});
	}
};
