// models/report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		category: {
			type: String,
			enum: ["水電", "設備", "環境", "其他", "治安"],
			default: "其他",
			required: true,
		},
		location: {
			type: String,
			trim: true,
		},
		status: {
			type: String,
			enum: ["待處理", "處理中", "已完成"],
			default: "待處理",
		},
		community: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Community",
			required: true,
		},
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		image: {
			type: String,
		},
	},
	{ timestamps: true }
);

export default mongoose.model("Report", reportSchema);
