// index.js
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { mongooseIdPlugin } from "./utils/mongooseIdPlugin.js";
mongoose.plugin(mongooseIdPlugin);

// 引入使用者 跟 社區路由
import userRouter from "./routes/user.js";
import communityRouter from "./routes/community.js";

// 引入公告路由
import announcement from "./routes/announcement.js";

// 引入活動路由
import eventRouter from "./routes/event.js";

// 引入貼文路由
import postRoutes from "./routes/post.js";

// 引入留言路由
import commentRouter from "./routes/comment.js";

// 引入回報路由
import reportRouter from "./routes/report.js";

// 災害回報
import disasterCheckRoutes from "./routes/disasterCheck.js";

// 每日問候
import dailyGreetingRoutes from "./routes/dailyGreeting.js";

const PORT = process.env.PORT || 4000;

// MongoDB 連線
mongoose
	.connect(process.env.DB_URL)
	.then(() => {
		console.log("✅ 資料庫連線成功");
		mongoose.set("sanitizeFilter", true);
	})
	.catch((error) => {
		console.log("❌ 資料庫連線失敗");
		console.error(error);
	});

const app = express();
app.use(cors());
app.use(express.json());

// 紀錄每個進來的請求路徑
app.use((req, res, next) => {
	console.log("📥 收到請求:", req.method, req.url);
	next();
});

// 測試首頁
app.get("/", (req, res) => {
	res.send("好鄰聚後端 API");
});

// 掛上使用者 跟 社區路由
app.use("/api/users", userRouter);
app.use("/api/communities", communityRouter);
// 掛上公告路由
app.use("/api/announcements", announcement);

// 掛上活動路由
app.use("/api/events", eventRouter);

// 掛上貼文路由
app.use("/api/posts", postRoutes);

// 掛上留言路由
app.use("/api/comments", commentRouter);

// 掛上回報路由
app.use("/api/reports", reportRouter);

// 災害回報
app.use("/api/disaster", disasterCheckRoutes);

// 每日問候
app.use("/api/dailygreeting", dailyGreetingRoutes);

// 處理所有未被定義的路由
app.all(/.*/, (req, res) => {
	res.status(StatusCodes.NOT_FOUND).json({
		success: false,
		message: `找不到該路由 ${req.method} ${req.originalUrl}`,
	});
});

// 啟動伺服器
app.listen(PORT, () => {
	console.log(`🚀 伺服器已啟動 http://localhost:${PORT}`);
});
