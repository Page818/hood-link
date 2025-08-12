// models/event.js

import mongoose from "mongoose";
// import { mongooseIdPlugin } from "../utils/mongooseIdPlugin.js";

const eventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		// 活動舉辦日期
		date: {
			type: Date,
			required: true,
		},
		// 報名截止日
		registrationDeadline: {
			type: Date,
			default: null,
		},

		content: {
			type: String,
			required: true,
		},
		image: {
			type: String,
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
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{
		timestamps: true, // createdAt / updatedAt
	}
);
// eventSchema.plugin(mongooseIdPlugin);
const Event = mongoose.model("Event", eventSchema);
export default Event;
