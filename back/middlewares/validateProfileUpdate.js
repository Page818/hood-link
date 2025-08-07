export const validateProfileUpdate = (req, res, next) => {
	const { email, phone } = req.body;

	if (email && !/.+@.+\..+/.test(email)) {
		return res.status(400).json({
			success: false,
			message: "Email 格式錯誤",
		});
	}

	if (phone && !/^\d{10}$/.test(phone)) {
		return res.status(400).json({
			success: false,
			message: "手機號碼格式錯誤",
		});
	}

	next();
};
