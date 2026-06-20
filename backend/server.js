const express = require("express");
const cors = require("cors");

const mergeRoutes = require("./routes/merge");

const app = express();
const PORT = 4000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Allow cross-origin requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

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
