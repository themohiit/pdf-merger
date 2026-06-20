const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const os = require("os");

const mergeRoutes = require("./routes/merge");

const app = express();
const PORT = 4000;

// ---------------------------------------------------------------------------
// Ensure required directories exist on startup (using temp directory for Vercel/serverless support)
// ---------------------------------------------------------------------------
const uploadsDir = path.join(os.tmpdir(), "pdf-merger-uploads");
const mergedDir = path.join(os.tmpdir(), "pdf-merger-merged");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(mergedDir)) fs.mkdirSync(mergedDir, { recursive: true });

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Allow requests from the Vite dev server
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// Parse JSON request bodies
app.use(express.json());

// Serve merged PDF files as static downloads
app.use("/downloads", express.static(mergedDir));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api", mergeRoutes);

// ---------------------------------------------------------------------------
// Global error-handling middleware
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// ---------------------------------------------------------------------------
// Start server (only if not running as a Vercel serverless function)
// ---------------------------------------------------------------------------
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`PDF Merger backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
