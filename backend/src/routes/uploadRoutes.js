import { Router } from "express";
import { imageUpload, uploadImage } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roleCheck.js";

const uploadRouter = Router();
const superAdmin = [requireAuth, requireRoles("super_admin")];

uploadRouter.post("/images", superAdmin, imageUpload.single("image"), uploadImage);

export default uploadRouter;
