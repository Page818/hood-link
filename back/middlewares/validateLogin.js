// middleware/validateLogin.js

export const validateLogin = (req, res, next) => {
  const { account, password } = req.body;

  // 檢查是否有帳號與密碼
  if (!account || !password) {
    return res.status(400).json({
      success: false,
      message: "請提供帳號與密碼",
    });
  }

  // 檢查帳號格式（台灣手機 or email）
  const isPhone = /^\d{10}$/.test(account);
  const isEmail = /.+@.+\..+/.test(account);

  if (!isPhone && !isEmail) {
    return res.status(400).json({
      success: false,
      message: "帳號格式錯誤，請輸入手機號碼或 Email",
    });
  }

  // 通過驗證，進入下一步
  next();
};
