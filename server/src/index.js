import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { db } from "./db.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import storeRoutes from "./routes/store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

// Serve uploaded images statically (with SVG support)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);

// Health & DB Check Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running"
  });
});

app.get("/api/db-check", async (req, res) => {
  try {
    const userCount = await db.orm.public.User.all();
    res.json({
      status: "success",
      message: "Connected to PostgreSQL via Prisma!",
      usersCount: userCount.length
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Global Process Error Handlers for cloud deployments
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION at:", promise, "reason:", reason);
});

// Serve frontend build in production
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      // Fallback if index.html isn't ready
      res.status(200).send("Social Media Sellers API is active.");
    }
  });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is running and listening on 0.0.0.0:${port}`);
});

server.on("error", (err) => {
  console.error("❌ Server listen error:", err);
});


