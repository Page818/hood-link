// controllers/dailyGreeting.js
import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	reply: {
		type: String,
		enum: ["美好的一天", "需要幫助QQ"],
		required: true,
	},
	replyAt: {
		type: Date,
		default: Date.now,
	},
});

const dailyGreetingSchema = new mongoose.Schema(
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
		date: {
			type: String,
			required: true,
		},
		// YYYY-MM-DD
		responses: [responseSchema],
		status: {
			type: String,
			enum: ["進行中", "已結束"],
			default: "進行中",
		},
	},
	{ timestamps: true }
);

export default mongoose.model("DailyGreeting", dailyGreetingSchema);
