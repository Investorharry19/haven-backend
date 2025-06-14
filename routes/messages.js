import { Router } from "express";
import UserSchema from "../schema/user.js";
import MessagesSchema from "../schema/messages.js";
import { memUpload } from "../utils/multer.js";
import cloud from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import streamifier from "streamifier";
import Ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { PassThrough } from "stream";
import filterSetting from "../utils/filterSetting.js";
import userSockets from "../utils/userSockets.js";
import MediaReference from "../schema/media-reference.js";

Ffmpeg.setFfmpegPath(ffmpegStatic);

const MessageRouter = Router();

MessageRouter.post("/message/send/text-message", async (req, res) => {
  try {
    const data = req.body;
    const user = await UserSchema.findOne({ username: data.ownerUsername });

    if (!user) {
      return res.status(404).json({ message: "No user with this username" });
    }
    const newMessage = new MessagesSchema(data);
    await newMessage.save();

    const io = req.app.get("io"); // <-- this gives access to Socket.IO instance

    const recipientSocketId = userSockets[data.ownerUsername];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new-anonymous-message", newMessage);
    }

    return res.status(200).json(newMessage);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

MessageRouter.post(
  "/message/send/audio-message",
  memUpload.fields([{ name: "file" }]),
  async (req, res) => {
    try {
      const data = req.body;
      const user = await UserSchema.findOne({ username: data.ownerUsername });
      console.log(data.ownerUsername);
      if (!user) {
        return res.status(404).json({ message: "No user with this username" });
      }

      const audioBuffer = req.files.file[0].buffer;
      const voice = parseFloat(req.body.voice);

      // === Process and upload audio ===
      const filters = filterSetting(voice);
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const ffmpegStream = Ffmpeg()
          .input(streamifier.createReadStream(audioBuffer))
          .audioFilters(filters)
          .format("mp3")
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            reject(new Error("Error processing audio with FFmpeg"));
          });

        const cloudinaryUploadStream = cloud.uploader.upload_stream(
          { resource_type: "video" }, // or "auto" or "audio"
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(new Error("Error uploading to Cloudinary"));
            } else {
              resolve(result);
            }
          }
        );

        ffmpegStream.pipe(cloudinaryUploadStream);
      });

      // === Save message ===
      const newMessage = new MessagesSchema({
        ...data,
        audioUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
      });
      await newMessage.save();
      const newMedia = new MediaReference({
        publicId: cloudinaryResult.public_id,
      });
      await newMedia.save();

      const io = req.app.get("io"); // <-- this gives access to Socket.IO instance

      const recipientSocketId = userSockets[data.ownerUsername];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("new-anonymous-message", newMessage);
      }

      return res
        .status(200)
        .json({ cloudinaryUrl: cloudinaryResult.secure_url });
    } catch (error) {
      console.error("Unhandled error:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal Server Error" });
    }
  }
);
MessageRouter.post(
  "/message/process/audio-message",
  memUpload.fields([{ name: "file" }]),
  async (req, res) => {
    try {
      const audioBuffer = req.files.file[0].buffer;
      const voice = parseFloat(req.body.voice);

      let filters = filterSetting(voice);

      // === Process and upload return ===

      const passthroughStream = new PassThrough();
      Ffmpeg()
        .input(streamifier.createReadStream(audioBuffer))
        .audioFilters(filters)
        .audioCodec("libmp3lame")
        .format("mp3")
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          new Error("Error processing audio with FFmpeg");
        })
        .on("end", () => {
          console.log("FFmpeg processing finished.");
          // Once processing is finished, you can finalize the response here.
          res.end(); // End the response after FFmpeg completes the stream
        })
        .pipe(passthroughStream);

      passthroughStream.pipe(res);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="processed.mp3"'
      );
    } catch (error) {
      console.error("Unhandled error:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal Server Error" });
    }
  }
);

MessageRouter.get("/message/get-messages/:username", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({
        name: "JsonWebTokenError",
        message: "invalid token",
      });
    }
    const token = authorization.split("Bearer ")[1];

    const verifiedToken = jwt.verify(token, process.env.JWTSECRET);

    const username = req.params.username;
    const user = await UserSchema.findOne({ username });
    console.log(user);

    if (!user) {
      return res.status(404).json({ message: "No user with this username" });
    }
    console.log(verifiedToken);
    if (verifiedToken.Id !== user._id.toString()) {
      return res.status(400).json({
        message: "You can only view your own messages",
      });
    }

    const threeDaysDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const deletedMessages = await MessagesSchema.deleteMany({
      ownerUsername: username,
      createdAt: { $lt: threeDaysDate },
      isStarred: false,
    });

    console.log(deletedMessages);

    const messages = await MessagesSchema.find({
      ownerUsername: username,
    }).sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ messages, deleteCount: deletedMessages.deletedCount });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// mark as read
MessageRouter.patch("/message/mark-message-as-read/:id", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({
        name: "JsonWebTokenError",
        message: "invalid token",
      });
    }
    const token = authorization.split("Bearer ")[1];

    const verifiedToken = jwt.verify(token, process.env.JWTSECRET);

    const id = req.params.id;
    const message = await MessagesSchema.findOne({ _id: id });
    if (!message) {
      return res.status(404).json({ message: "No message with this id" });
    }

    const user = await UserSchema.findOne({
      username: message.ownerUsername,
    });

    if (verifiedToken.Id !== user._id.toString()) {
      return res.status(400).json({
        message: "You can only edit your own messages",
      });
    }

    message.isOpened = true;
    await message.save();

    return res.status(200).json(message);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});
// add to favourites
MessageRouter.patch("/message/star-message/:id", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({
        name: "JsonWebTokenError",
        message: "invalid token",
      });
    }
    const token = authorization.split("Bearer ")[1];

    const verifiedToken = jwt.verify(token, process.env.JWTSECRET);

    const id = req.params.id;
    const message = await MessagesSchema.findOne({ _id: id });
    if (!message) {
      return res.status(404).json({ message: "No message with this id" });
    }

    const user = await UserSchema.findOne({
      username: message.ownerUsername,
    });

    if (verifiedToken.Id !== user._id.toString()) {
      return res.status(400).json({
        message: "You can only edit your own messages",
      });
    }

    if (message.isStarred) {
      message.isStarred = false;
    } else {
      message.isStarred = true;
    }
    await message.save();

    return res.status(200).json(message);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// delete one message
MessageRouter.delete("/message/delete-message/:id", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({
        name: "JsonWebTokenError",
        message: "invalid token",
      });
    }
    const token = authorization.split("Bearer ")[1];

    const verifiedToken = jwt.verify(token, process.env.JWTSECRET);

    const id = req.params.id;
    const message = await MessagesSchema.findOne({ _id: id });

    if (!message) {
      return res.status(404).json({ message: "No message with this id" });
    }
    console.log(message, 168);
    const user = await UserSchema.findOne({
      username: message.ownerUsername,
    });

    console.log(user, 174);
    if (verifiedToken.Id !== user._id.toString()) {
      return res.status(400).json({
        message: "You can only delete your own messages",
      });
    }

    await MessagesSchema.deleteOne({ _id: id });

    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// delete all messages
MessageRouter.delete(
  "/message/delete-all-message/:username",
  async (req, res) => {
    try {
      const { authorization } = req.headers;

      if (!authorization || authorization.length < 10) {
        return res.status(400).json({
          name: "JsonWebTokenError",
          message: "invalid token",
        });
      }
      const token = authorization.split("Bearer ")[1];

      const verifiedToken = jwt.verify(token, process.env.JWTSECRET);

      const username = req.params.username;
      const user = await UserSchema.findOne({
        username,
      });

      if (!user) {
        return res.status(404).json({ message: "No user with this username" });
      }
      if (verifiedToken.Id !== user._id.toString()) {
        return res.status(400).json({
          message: "You can only delete your own messages",
        });
      }

      await MessagesSchema.deleteMany({ ownerUsername: username });

      return res.status(200).json({ deleted: true });
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
);

// MessageRouter.post("/message/process/create-video-stream", async (req, res) => {
//   try {
//     const passthroughStream = new PassThrough();
//     Ffmpeg()
//       // .addInput("video.jpg")
//       .addInput(req.body.audioUrl)
//       .inputFormat("mp3")
//       .outputOptions([
//         "-c:v libx264",
//         "-tune stillimage",
//         "-c:a aac",
//         "-b:a 192k",
//         "-pix_fmt yuv420p",
//         "-shortest",
//       ])
//       .format("mp4")
//       .on("error", (err) => {
//         console.error("FFmpeg error:", err);
//         new Error("Error processing audio with FFmpeg");
//       })
//       .on("end", () => {
//         console.log("FFmpeg processing finished.");
//         // Once processing is finished, you can finalize the response here.
//         res.end(); // End the response after FFmpeg completes the stream
//       })
//       .pipe(passthroughStream);

//     console.log("Dnoe");
//     passthroughStream.pipe(res);

//     res.setHeader("Content-Type", "video/mp4");
//     res.setHeader(
//       "Content-Disposition",
//       'attachment; filename="processed.mp4"'
//     );
//   } catch (error) {
//     console.error("Unhandled error:", error);
//     return res
//       .status(500)
//       .json({ message: error.message || "Internal Server Error" });
//   }
// });
export default MessageRouter;
