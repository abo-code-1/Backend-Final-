import { Router } from "express";
import authRouter from "./authRoutes.js";
import listingRouter from "./listingRoutes.js";
import billRouter from "./billRoutes.js";
import savedSearchRouter from "./savedSearchRoutes.js";
import favoriteRouter from "./favoriteRoutes.js";
import applicationRouter from "./applicationRoutes.js";
import adminRouter from "./adminRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/listings", listingRouter);
apiRouter.use("/", billRouter);
apiRouter.use("/", savedSearchRouter);
apiRouter.use("/", favoriteRouter);
apiRouter.use("/", applicationRouter);
apiRouter.use("/admin", adminRouter);

export default apiRouter;
