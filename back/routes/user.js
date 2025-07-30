// routes/user.js
import express from "express";
import auth from "../middlewares/auth.js";
import { register, login, getCurrentUser,updateProfile } from "../controllers/user.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getCurrentUser); // 加入 JWT 驗證中介層
router.patch("/update", auth, updateProfile);

export default router;
