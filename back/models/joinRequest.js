// models/joinRequest.js
import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
	{
		community: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Community",
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			// 狀態 待審核 / 已核准 / 已拒絕
			enum: ["pending", "approved", "rejected"],
			default: "pending",
		},
	},
	{
		timestamps: true,
	}
);

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);
export default JoinRequest;
