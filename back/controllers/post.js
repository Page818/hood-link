// controllers/post.js
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import Post from "../models/post.js";
import Community from "../models/community.js";
import cloudinary from "../config/cloudinary.js"; // ← 注意相對路徑

// 建立貼文
export const createPost = async (req, res) => {
	try {
		const { title, content, image, imagePublicId, category, communityId } =
			req.body;

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
			image: image || "",
			imagePublicId: imagePublicId || "",
			category,
			community: communityId,
			creator: req.user._id,
			comments: [],
		});

		await newPost.save();

		return res.status(StatusCodes.CREATED).json({
			success: true,
			message: "貼文已建立",
			post: newPost,
		});
	} catch (err) {
		console.error("❌ 建立貼文失敗", err);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法建立貼文",
		});
	}
};

// 編輯貼文（含圖片更換/移除會刪舊圖）
export const updatePost = async (req, res) => {
	try {
		const { postId } = req.params;
		const { title, content, image, imagePublicId, category } = req.body;

		if (!mongoose.Types.ObjectId.isValid(postId)) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ success: false, message: "無效的貼文 ID" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到貼文" });
		}

		// 僅作者可編輯
		if (String(post.creator) !== String(req.user._id)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限編輯這篇貼文",
			});
		}

		// 判斷是否需要刪舊圖
		const hadImage = Boolean(post.imagePublicId);
		const wantRemoveImage = image === "" || imagePublicId === ""; // 明確清空
		const wantReplaceImage =
			image &&
			imagePublicId &&
			(image !== post.image || imagePublicId !== post.imagePublicId);

		if ((wantRemoveImage || wantReplaceImage) && hadImage) {
			try {
				await cloudinary.uploader.destroy(post.imagePublicId, {
					invalidate: true,
				});
			} catch (e) {
				console.warn(
					"⚠️ Cloudinary destroy 失敗（略過，不影響更新）:",
					e?.message || e
				);
			}
		}

		// 套用更新欄位（允許清空字串）
		if (title !== undefined) post.title = title;
		if (content !== undefined) post.content = content;
		if (category !== undefined) post.category = category;
		if (image !== undefined) post.image = image;
		if (imagePublicId !== undefined) post.imagePublicId = imagePublicId;

		await post.save();

		return res.status(StatusCodes.OK).json({
			success: true,
			message: "貼文已更新",
			post,
		});
	} catch (err) {
		console.error("❌ 更新貼文失敗", err);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "無法更新貼文",
		});
	}
};

// 刪除貼文（含刪雲端圖片，作者或社區管理員可刪）
export const deletePost = async (req, res) => {
	try {
		const { postId } = req.params;

		if (!mongoose.isValidObjectId(postId)) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "無效的貼文 ID",
			});
		}

		const post = await Post.findById(postId).select(
			"_id creator community imagePublicId"
		);
		if (!post) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到貼文:(" });
		}

		const isOwner = String(post.creator) === String(req.user._id);

		// 社區管理員也可刪
		let isCommunityAdmin = false;
		if (post.community) {
			const community = await Community.findById(post.community).select(
				"admins"
			);
			if (community?.admins?.length) {
				isCommunityAdmin = community.admins.some(
					(id) => String(id) === String(req.user._id)
				);
			}
		}

		if (!(isOwner || isCommunityAdmin)) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限刪除這篇貼文",
			});
		}

		// 先刪雲端圖片（若有）
		if (post.imagePublicId) {
			try {
				await cloudinary.uploader.destroy(post.imagePublicId, {
					invalidate: true,
				});
			} catch (e) {
				console.warn(
					"⚠️ Cloudinary destroy 失敗（略過，不影響刪文）:",
					e?.message || e
				);
			}
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
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "找不到貼文" });
		}

		// 權限：使用者需屬於貼文社區
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

		return res.status(StatusCodes.OK).json({ success: true, post });
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

		// 權限：需屬於該社區
		const userCommunities = (req.user.community || []).map(String);
		if (!userCommunities.includes(String(communityId))) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "你沒有權限瀏覽這個社區",
			});
		}

		const q = { community: communityId };
		if (category && category !== "全部") q.category = category;

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
