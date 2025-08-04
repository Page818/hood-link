// controller/comment.js

import Comment from "../models/comment.js";
import Post from "../models/post.js";

import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";

// 新增留言
export const createComment = async (req, res) => {
	try {
		const { postId } = req.params;
		const { content } = req.body;

		if (!mongoose.isValidObjectId(postId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的貼文 ID",
			});
		}

		if (!content || content.trim().length === 0) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "請輸入留言內容",
			});
		}
		const post = await Post.findById(postId).select("community");
		if (!post) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到貼文" });
		}
		const userCommunities = (req.user.community || []).map(String);
		if (!userCommunities.includes(String(post.community))) {
			return res
				.status(StatusCodes.FORBIDDEN)
				.json({ success: false, message: "你沒有權限留言" });
		}
		const comment = await Comment.create({
			post: postId,
			content,
			creator: req.user._id,
		});
		return res.status(StatusCodes.CREATED).json({
			success: true,
			message: "留言成功",
			comment,
		});
	} catch (err) {
		console.error("❌ 新增留言失敗", err);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: "無法新增留言" });
	}
};

// 取得貼文下所有留言
export const getCommentsByPost = async (req, res) => {
	try {
		const { postId } = req.params;

		if (!mongoose.isValidObjectId(postId)) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: "無效的貼文 ID" });
		}

		// 查貼文、驗證社區成員
		const post = await Post.findById(postId).select("community");
		if (!post) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到貼文" });
		}
		const userCommunities = (req.user.community || []).map(String);
		if (!userCommunities.includes(String(post.community))) {
			return res
				.status(StatusCodes.FORBIDDEN)
				.json({ success: false, message: "你沒有權限查看留言" });
		}

		const comments = await Comment.find({ post: postId })
			.sort({ createdAt: 1 })
			.populate("creator", "name email");

		return res.status(StatusCodes.OK).json({ success: true, comments });
	} catch (err) {
		console.error("❌ 查詢留言失敗", err);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: "無法取得留言列表" });
	}
};

// 編輯留言（只限本人）
export const updateComment = async (req, res) => {
	try {
		const { commentId } = req.params;
		const { content } = req.body;

		if (!mongoose.isValidObjectId(commentId)) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: "無效的留言 ID" });
		}
		if (!content || content.trim().length === 0) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: "請輸入留言內容" });
		}

		// 查留言、貼文，驗證本人與社區成員
		const comment = await Comment.findById(commentId).populate({
			path: "post",
			select: "community",
		});
		if (!comment) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到留言" });
		}

		if (comment.creator.toString() !== req.user._id.toString()) {
			return res
				.status(StatusCodes.FORBIDDEN)
				.json({ success: false, message: "你沒有權限編輯這則留言" });
		}

		const userCommunities = (req.user.community || []).map(String);
		if (!userCommunities.includes(String(comment.post.community))) {
			return res
				.status(StatusCodes.FORBIDDEN)
				.json({ success: false, message: "你沒有權限編輯這則留言" });
		}

		comment.content = content;
		comment.updatedAt = new Date();
		await comment.save();

		return res
			.status(StatusCodes.OK)
			.json({ success: true, message: "留言已更新", comment });
	} catch (err) {
		console.error("❌ 編輯留言失敗", err);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ success: false, message: "無法編輯留言" });
	}
};
