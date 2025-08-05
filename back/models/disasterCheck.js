// models/disasterCheck.js

import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	reply: {
		type: String,
		enum: ["我沒事", "請求幫助"],
		required: true,
	},
	replyAt: {
		type: Date,
		default: Date.now,
	},
});

const disasterCheckSchema = new mongoose.Schema(
	{
		message: {
			type: String,
			required: true,
		},
		community: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Community",
			required: true,
		},
		responses: [responseSchema], // 嵌套
		status: {
			type: String,
			enum: ["進行中", "已結束"],
			default: "進行中",
		},
	},
	{ timestamps: true }
);

export default mongoose.model("DisasterCheck", disasterCheckSchema);
