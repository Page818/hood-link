// middleware/validateRegister.js

export const validateRegister = (req, res, next) => {
	const { name, email, phone, password } = req.body;

	// 必填欄位：name + password + (email or phone)
	if (!name || !password || (!email && !phone)) {
		return res.status(400).json({
			success: false,
			message: "請提供姓名、密碼，並至少輸入 Email 或手機號碼",
		});
	}

	if (password.length < 6) {
		return res.status(400).json({
			success: false,
			message: "密碼至少需 6 碼",
		});
	}

	if (email && !/.+@.+\..+/.test(email)) {
		return res.status(400).json({
			success: false,
			message: "Email 格式不正確",
		});
	}

	if (phone && !/^\d{10}$/.test(phone)) {
		return res.status(400).json({
			success: false,
			message: "手機號碼格式不正確",
		});
	}

	next();
};
