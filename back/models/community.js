// models/community.js
import mongoose from "mongoose";
import { mongooseIdPlugin } from '../utils/mongooseIdPlugin.js'

const communitySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		// 社區地址
		address: {
			type: String,
			required: true,
			trim: true,
		},
		// 是否為公開社區
		isPublic: {
			type: Boolean,
			default: true,
		},

		// 創建使用者
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			// 指向 User model，可搭配 .populate() 把使用者資料拉出來
			ref: "User",
			required: true,
		},

		admins: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		members: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		status: {
			type: String,
			enum: ["approved", "pending", "rejected"],

			// 初期先自動核准
			// 日後可以改為「需管理者審核」時，把 default 改成 pending
			default: "approved",
		},
	},
	{
		timestamps: true,
	}
);

communitySchema.plugin(mongooseIdPlugin) 
const Community = mongoose.model("Community", communitySchema);
export default Community;
