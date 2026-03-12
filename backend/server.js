const express = require("express");
const cors    = require("cors");

const authRoutes       = require("./routes/auth");
const userRoutes       = require("./routes/users");
const categoryRoutes   = require("./routes/categories");
const workerRoutes     = require("./routes/workers");
const bookingRoutes    = require("./routes/bookings");
const commissionRoutes = require("./routes/commission");
const pincodeRoutes    = require("./routes/pincode");
const messageRoutes    = require("./routes/messages");

const { isSimulationMode } = require("./services/paymentService");
const { COMMISSION_RATE }  = require("./services/commissionService");

const app  = express();
const PORT = process.env.PORT || 5001;

// ── CORS: allow both User/Worker Portal AND Admin Portal ─────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : [
      "http://localhost:5173", "http://127.0.0.1:5173",  // User/Worker Portal
      "http://localhost:5174", "http://127.0.0.1:5174",  // Admin Portal
    ];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth",       authRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/workers",    workerRoutes);
app.use("/api/bookings",   bookingRoutes);
app.use("/api/commission", commissionRoutes);
app.use("/api/pincode",    pincodeRoutes);
app.use("/api/messages",  messageRoutes);

app.get("/api/health", (_req, res) => res.json({
  status:         "ok",
  time:           new Date(),
  paymentMode:    isSimulationMode() ? "simulation" : "live",
  commissionRate: `${(COMMISSION_RATE * 100).toFixed(0)}%`,
}));

app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║     GeoServe Shared Backend  ·  Running!                 ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  URL         : http://localhost:${PORT}                      ║`);
  console.log("║  Serves      : User/Worker Portal + Admin Portal         ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Allowed origins:                                        ║");
  allowedOrigins.forEach(o => console.log(`║    · ${o.padEnd(50)}║`));
  console.log("╚══════════════════════════════════════════════════════════╝\n");
});
