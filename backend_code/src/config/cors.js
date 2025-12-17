const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // mobile apps / curl
    if (ALLOWED_ORIGINS.length === 0) return cb(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
};

module.exports = corsOptions;
