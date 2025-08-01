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

// 編輯貼文
export const updatePost = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, content, image, category } = req.body;

		const post = await Post.findById(id);
		if (!post) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到貼文",
			});
		}
		// 僅限貼文作者本人可修改
		if (post.creator.toString() !== req.user._id.toString()) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限編輯這篇貼文",
			});
		}

		// 更新內容
		if (title) post.title = title;
		if (content) post.content = content;
		if (image !== undefined) post.image = image;
		if (category) post.category = category;

		await post.save();

		res.status(StatusCodes.OK).json({
			success: true,
			message: "貼文已更新",
			post,
		});
	} catch (err) {
		console.error("❌ 更新貼文失敗", err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法更新貼文",
		});
	}
};
