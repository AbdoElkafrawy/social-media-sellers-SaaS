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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
