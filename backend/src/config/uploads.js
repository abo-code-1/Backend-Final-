import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadRoot = path.resolve(__dirname, "../../uploads");
export const imageUploadDir = path.join(uploadRoot, "images");

export const ensureUploadDirs = () => {
  fs.mkdirSync(imageUploadDir, { recursive: true });
};
