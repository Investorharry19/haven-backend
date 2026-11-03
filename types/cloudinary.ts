import { UploadApiResponse } from "cloudinary";

export interface coudinaryResponse extends UploadApiResponse {
  secure_url: string;
  public_id: string;
}
