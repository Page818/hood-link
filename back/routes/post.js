// routes/post.js

import express from "express";
import {
	createPost,
	updatePost,
	deletePost,
	getPostById,
	getPostsByCommunity,
} from "../controllers/post.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 新增貼文
router.post("/create", auth, createPost);

// 編輯貼文
router.put("/:postId", auth, updatePost);

// 刪除貼文
router.delete("/:postId", auth, deletePost);

// 查單一貼文
// router.get("/id/:postId", auth, getPostById);
router.get("/community/:communityId/posts/:postId", auth, getPostById);

// 貼文列表
router.get("/community/:communityId", auth, getPostsByCommunity);

export default router;
