import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";

const appRoutes = Router()

appRoutes.use("/auth", authRouter);

export default appRoutes