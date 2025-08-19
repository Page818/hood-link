// routes/cloudinary.js
import express from "express";
import crypto from "crypto";
import auth from "../middlewares/auth.js"; // 你現有的登入驗證

const router = express.Router();

router.get("/signature", auth, (req, res) => {
	const timestamp = Math.round(Date.now() / 1000);

	// 你要簽名的參數（除了 file 以外要送到 Cloudinary 的都要簽）
	const params = {
		timestamp,
		upload_preset: process.env.CLD_UPLOAD_PRESET,
		folder:
			req.query.folder || process.env.CLD_UPLOAD_FOLDER || "hood-link/posts",
		// 可選：以下若要一併帶上，也要納入簽名
		// use_filename: true,
		// unique_filename: true,
		// overwrite: false,
	};

	// 依字母排序串接
	const toSign = Object.keys(params)
		.sort()
		.map((k) => `${k}=${params[k]}`)
		.join("&");

	const signature = crypto
		.createHash("sha1")
		.update(toSign + process.env.CLD_API_SECRET)
		.digest("hex");

	res.json({
		cloudName: process.env.CLD_CLOUD_NAME,
		apiKey: process.env.CLD_API_KEY,
		timestamp,
		signature,
		...params, // 回傳 upload_preset / folder 等
	});
});

export default router;
