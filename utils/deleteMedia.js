import { promisify } from "util";
import cloud from "./cloudinary.js";
import MediaReference from "../schema/media-reference.js";

async function deleteOldMedia() {
  try {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const oldMedia = await MediaReference.find({
      createdAt: { $lt: fourDaysAgo },
    });

    await Promise.all(
      oldMedia.map(async (media) => {
        const uploadPromise = promisify(cloud.uploader.destroy);
        await uploadPromise(media.publicId);
      })
    );
    MediaReference.deleteMany({
      createdAt: { $lt: fourDaysAgo },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("old media deleted");
  }
}
export default deleteOldMedia;
