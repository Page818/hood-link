// controllers/post.js
import Post from "../models/post.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

// 建立貼文
export const createPost = async (req, res) => {
	try {
		const { title, content, image, category, communityId } = req.body;

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

		if (post.creator.toString() !== req.user._id.toString()) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限編輯這篇貼文",
			});
		}

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

// 貼文列表（支援 page/limit/category）
export const getPostsByCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;
		const { page = 1, limit = 10, category } = req.query;

		if (!mongoose.isValidObjectId(communityId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的社區 ID",
			});
		}

		const userCommunities = (req.user.community || []).map(String);
		if (!userCommunities.includes(String(communityId))) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限瀏覽這個社區",
			});
		}

		const q = { community: communityId };
		if (category && category !== "全部") {
			q.category = category;
		}

		const pageNum = Math.max(1, Number(page) || 1);
		const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
		const skip = (pageNum - 1) * limitNum;

		const [items, total] = await Promise.all([
			Post.find(q)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNum)
				.populate("creator", "name email")
				.populate("community", "name"),
			Post.countDocuments(q),
		]);

		return res.status(StatusCodes.OK).json({
			success: true,
			items,
			total,
			page: pageNum,
			limit: limitNum,
			totalPages: Math.max(1, Math.ceil(total / limitNum)),
			query: { category: category || "全部" },
		});
	} catch (err) {
		console.error("❌ 取得貼文列表失敗", err);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法取得貼文列表",
		});
	}
};
