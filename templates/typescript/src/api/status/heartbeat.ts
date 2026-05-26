import { StatusCodes } from "http-status-codes";
import type { Router } from "express";

export const heartbeat = (router: Router) => {
  router.get("/heartbeat", (_, res) => {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "API is alive",
      timestamp: new Date().toISOString(),
    });
  });
};
