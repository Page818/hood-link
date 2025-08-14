// routes/comment.js

import express from "express";

import {
	createComment,
	updateComment,
	getCommentsByPost,
} from "../controllers/comment.js";

import auth from "../middlewares/auth.js";

const router = express.Router();


// 新增留言
router.post("/post/:postId", auth, createComment);

// 編輯留言
router.put("/:commentId", auth, updateComment);

// 取得貼文留言
router.get("/post/:postId", auth, getCommentsByPost);

export default router;
