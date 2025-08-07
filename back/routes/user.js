// routes/user.js
import express from "express";
import auth from "../middlewares/auth.js";
import { validateLogin } from "../middlewares/validateLogin.js";
import { validateRegister } from "../middlewares/validateRegister.js";
import { validateProfileUpdate } from "../middlewares/validateProfileUpdate.js";

import {
	register,
	login,
	getCurrentUser,
	updateProfile,
} from "../controllers/user.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", auth, getCurrentUser);
router.patch("/update", auth, validateProfileUpdate, updateProfile);

export default router;
