import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many attempts, please try again after 1 minute.",
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});
