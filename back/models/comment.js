// models/comment.js
import mongoose from "mongoose";
import { trim } from "validator";

const commentSchema = new mongoose.Schema(
	{
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			required: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		creator: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);
export default mongoose.model("Comment", commentSchema);
