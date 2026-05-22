import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import { imageUploadDir } from "../config/uploads.js";
import { HttpError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const extensionByMime = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imageUploadDir),
  filename: (_req, file, cb) => {
    const ext =
      extensionByMime[file.mimetype] ||
      path.extname(file.originalname).toLowerCase() ||
      ".img";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new HttpError(400, "INVALID_FILE_TYPE", "Можно загружать только изображения"));
};

export const imageUpload = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Файл изображения обязателен" });
  }

  const relativeUrl = `/uploads/images/${req.file.filename}`;
  const absoluteUrl = `${req.protocol}://${req.get("host")}${relativeUrl}`;

  return res.status(201).json({
    message: "Изображение загружено",
    item: {
      url: absoluteUrl,
      path: relativeUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
  });
});
