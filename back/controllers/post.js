// controllers/post.js

import Post from "../models/post.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

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

		if (!mongoose.isValidObjectId(communityId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的社區 ID",
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
		const { postId } = req.params;
		const { title, content, image, category } = req.body;

		if (!mongoose.Types.ObjectId.isValid(postId)) {
			return res.status(400).json({ success: false, message: "無效的貼文 ID" });
		}

		const post = await Post.findById(postId);
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

// 刪除貼文
export const deletePost = async (req, res) => {
	try {
		const { postId } = req.params;

		if (!mongoose.isValidObjectId(postId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的貼文 ID",
			});
		}

		const post = await Post.findById(postId).select("_id creator community");
		if (!post) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到貼文:(",
			});
		}
		const isOwner = post.creator?.equals?.(req.user._id) === true;

		let isCommunityAdmin = false;
		if (post.community) {
			const community = await Community.findById(post.community).select(
				"admins"
			);
			if (community?.admins?.length) {
				isCommunityAdmin = community.admins.some((id) =>
					id.equals(req.user._id)
				);
			}
		}

		if (!(isOwner || isCommunityAdmin)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限刪除這篇貼文",
			});
		}

		await post.deleteOne();

		return res.status(StatusCodes.OK).json({
			success: true,
			message: "貼文已刪除",
		});
	} catch (err) {
		console.error("❌ 刪除貼文失敗", err);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法刪除貼文",
		});
	}
};

// 查單一貼文
export const getPostById = async (req, res) => {
	try {
		const { postId } = req.params;
		if (!mongoose.isValidObjectId(postId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的貼文ID",
			});
		}
		const post = await Post.findById(postId)
			.populate("creator", "name email")
			.populate("community", "name");

		if (!post) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "找不到貼文",
			});
		}
		// 使用者需屬於貼文所屬社區（支援多社區）
		const postCommunityId = post.community?._id
			? String(post.community._id)
			: String(post.community);
		const userCommunities = (req.user.community || []).map(String);

		if (!userCommunities.includes(postCommunityId)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限查看此貼文",
			});
		}
		return res.status(StatusCodes.OK).json({
			success: true,
			post,
		});
	} catch (err) {
		console.error("❌ 取得單一貼文失敗", err);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得貼文",
		});
	}
};

// 貼文列表
export const getPostsByCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;

		// 1. 先檢查 ObjectId 合法
		if (!mongoose.isValidObjectId(communityId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的社區 ID",
			});
		}

		// 2. 權限檢查：該用戶有沒有在這個社區
		const userCommunities = (req.user.community || []).map(String);
		if (!userCommunities.includes(String(communityId))) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限瀏覽這個社區",
			});
		}

		// 3. 查詢這個社區的貼文
		const items = await Post.find({ community: communityId })
			.sort({ createdAt: -1 })
			.populate("creator", "name email")
			.populate("community", "name");

		return res.status(StatusCodes.OK).json({
			success: true,
			items,
		});
	} catch (err) {
		console.error("❌ 取得貼文列表失敗", err);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得貼文列表",
		});
	}
};
