// models/post.js

import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},

		content: {
			type: String,
			required: true,
		},

		image: {
			type: String,
		},
		imagePublicId: {
			type: String,
		},
		category: {
			type: String,
			enum: [
				"鄰里閒聊",
				"推薦分享",
				"二手交換",
				"失物招領",
				"求助協尋",
				"其他",
			],
			default: "其他",
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

		comments: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
	},
	{
		timestamps: true,
	}
);

const Post = mongoose.model("Post", postSchema);
export default Post;
