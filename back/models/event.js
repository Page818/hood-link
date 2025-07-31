// models/event.js

import mongoose, { models } from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
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
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
