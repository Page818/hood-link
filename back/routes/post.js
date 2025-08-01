// routes/post.js

import express from "express";
import { createPost,updatePost } from "../controllers/post.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 新增貼文
router.post("/", auth, createPost);

// 編輯貼文
router.put("/:id", auth, updatePost);
export default router;
