import cors from "cors";
import express from "express";
import { registerAuthRoutes } from "@/auth";
import { getServerEnv } from "../env";
import { registerCategoryRoutes } from "./categories/route";

const { FRONTEND_URL } = getServerEnv();

export const createApp = () => {
  const app = express();
  app.get("/health-check", (_req, res) => {
    res.status(200).send("Hello Express!");
  });
  app.use(express.json());
  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true,
    }),
  );

  const apiRouter = express.Router();
  registerAuthRoutes(app);
  registerCategoryRoutes(apiRouter);
  app.use("/api", apiRouter);

  return app;
};
