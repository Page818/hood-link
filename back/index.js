// index.js
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { StatusCodes } from "http-status-codes";

import userRouter from "./routes/user.js"; // 我們接下來會寫這個

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

// 測試首頁
app.get("/", (req, res) => {
  res.send("好鄰聚後端 API");
});

// ✅ 掛上使用者路由
app.use("/api/users", userRouter);

// 處理所有未被定義的路由
app.all(/.*/, (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "找不到該路由",
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 伺服器已啟動 http://localhost:${PORT}`);
});
