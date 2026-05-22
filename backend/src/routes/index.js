import { Router } from "express";
import authRouter from "./authRoutes.js";
import listingRouter from "./listingRoutes.js";
import billRouter from "./billRoutes.js";
import savedSearchRouter from "./savedSearchRoutes.js";
import favoriteRouter from "./favoriteRoutes.js";
import applicationRouter from "./applicationRoutes.js";
import adminRouter from "./adminRoutes.js";
import cityRouter from "./cityRoutes.js";
import neighborhoodRouter from "./neighborhoodRoutes.js";
import uploadRouter from "./uploadRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/listings", listingRouter);
apiRouter.use("/", billRouter);
apiRouter.use("/", savedSearchRouter);
apiRouter.use("/", favoriteRouter);
apiRouter.use("/", applicationRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/cities", cityRouter);
apiRouter.use("/neighborhoods", neighborhoodRouter);
apiRouter.use("/uploads", uploadRouter);

export default apiRouter;
