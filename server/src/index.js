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

import fs from "fs";

const app = express();
const port = process.env.PORT || 5000;

// Security Middlewares (configured to allow external & uploaded media)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically (with SVG support)
app.use("/uploads", express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));


import { seedPixelStore } from "./seed-pixel-store.js";
import { exec } from "child_process";

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

// Manual Seed / Sync Trigger Route
app.get("/api/seed", async (req, res) => {
  try {
    const result = await seedPixelStore();
    res.json({
      status: "success",
      message: "Google Pixel store seeded successfully with local SVGs/images!",
      result
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Auto bootstrap check on startup
async function bootstrapDatabase() {
  try {
    const users = await db.orm.public.User.all();
    if (users.length === 0) {
      console.log("🌱 Fresh database detected. Seeding Google Pixel demo account...");
      await seedPixelStore();
    } else {
      console.log(`✅ Database ready with ${users.length} seller(s).`);
      // Auto-upgrade any legacy external image URLs to bundled SVGs/images
      const firstProduct = await db.orm.public.Product.first();
      if (firstProduct && firstProduct.images && firstProduct.images.includes("gsmarena")) {
        console.log("🔄 Updating legacy image URLs to bundled SVGs/images...");
        await seedPixelStore();
      }
    }
  } catch (err) {
    console.log("⚠️ Database tables may need sync. Running auto-migration...", err.message);
    exec("npx prisma db update --no-interactive --confirm social_seller_db", async (err, stdout, stderr) => {
      if (err) {
        console.error("Prisma db update error:", err.message);
      } else {
        console.log("✅ Prisma schema synced successfully:\n", stdout);
        await seedPixelStore();
      }
    });
  }
}
bootstrapDatabase();



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

// SPA Fallback middleware (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ status: 'error', message: 'API endpoint not found' });
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


