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

// ✅ 列表（放在單篇前面，避免被 /:postId 誤吃）
router.get("/community/:communityId", auth, getPostsByCommunity);

// ✅ 單篇（統一為 /posts/:postId）
router.get("/:postId", auth, getPostById);

export default router;
