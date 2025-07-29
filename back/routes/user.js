import express from "express";

const router = express.Router();

// 範例路由
router.get("/", (req, res) => {
  res.send("Hello from user route");
});

export default router;
