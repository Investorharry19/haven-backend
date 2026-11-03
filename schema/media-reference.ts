import mongoose, { Schema, mongo } from "mongoose";

const schema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const MediaReference = mongoose.model("media-reference", schema);

export default MediaReference;
