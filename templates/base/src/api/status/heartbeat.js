import { StatusCodes } from "http-status-codes";

export const heartbeat = (router) => {
  router.get("/heartbeat", (_, res) => {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "API is alive",
      timestamp: new Date().toISOString(),
    });
  });
};
