// models/user.js
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

// 使用者資料模型
const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
		},
		email: {
			type: String,
			trim: true,
			lowercase: true,
			unique: true,
			sparse: true,
			validate: {
				validator: (v) => v === "" || validator.isEmail(v),
				message: "Email 格式錯誤",
			},
		},
		phone: {
			type: String,
			trim: true,
			unique: true,
			sparse: true,
			validate: {
				validator: (v) => v === "" || validator.isMobilePhone(v, "zh-TW"),
				message: "手機格式錯誤",
			},
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false, // 預設查詢不回傳密碼
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		community: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Community",
		},
	},
	{
		timestamps: true, // 自動加入 createdAt, updatedAt
	}
);

// 在儲存前自動加密密碼（僅當密碼有修改時）
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

const User = mongoose.model("User", userSchema);
export default User;
