import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    publishDate: { 
      type: Date, 
      default: Date.now 
    },
    author: { 
      type: String, 
      default: "Admin" 
    },
    isUrgent: { 
      type: Boolean, 
      default: false 
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Notice", noticeSchema);
