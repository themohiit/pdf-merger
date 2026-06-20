const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const os = require("os");
const { PDFDocument } = require("pdf-lib");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

const uploadsDir = path.join(os.tmpdir(), "pdf-merger-uploads");
const mergedDir = path.join(os.tmpdir(), "pdf-merger-merged");

// ---------------------------------------------------------------------------
// Multer configuration – disk storage, 50 MB limit, PDF-only filter
// ---------------------------------------------------------------------------
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname} is not a PDF`), false);
    }
  },
});

// ---------------------------------------------------------------------------
// POST /api/merge
// Accepts up to 20 PDF files via the "files" field and an optional "order"
// field (JSON array of indices) that controls the merge sequence.
// ---------------------------------------------------------------------------
router.post("/merge", upload.array("files", 20), async (req, res, next) => {
  try {
    // ----- Validation --------------------------------------------------
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        error: "At least 2 PDF files are required for merging.",
      });
    }

    // Double-check MIME types (belt-and-suspenders alongside the fileFilter)
    const nonPdf = req.files.filter((f) => f.mimetype !== "application/pdf");
    if (nonPdf.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Non-PDF files detected: ${nonPdf.map((f) => f.originalname).join(", ")}`,
      });
    }

    // ----- Determine merge order ----------------------------------------
    let order;
    if (req.body.order) {
      order = typeof req.body.order === "string"
        ? JSON.parse(req.body.order)
        : req.body.order;
    } else {
      order = req.files.map((_, i) => i);
    }

    // ----- Merge PDFs ---------------------------------------------------
    const mergedPdf = await PDFDocument.create();
    const skippedFiles = []; // Track corrupted / unreadable files
    let totalPages = 0;

    for (const idx of order) {
      const file = req.files[idx];
      if (!file) {
        skippedFiles.push({ index: idx, reason: "Index out of range" });
        continue;
      }

      try {
        const pdfBytes = file.buffer;
        const srcDoc = await PDFDocument.load(pdfBytes, {
          ignoreEncryption: true,
        });

        const copiedPages = await mergedPdf.copyPages(
          srcDoc,
          srcDoc.getPageIndices()
        );

        for (const page of copiedPages) {
          mergedPdf.addPage(page);
          totalPages++;
        }
      } catch (pdfErr) {
        console.warn(
          `Skipping "${file.originalname}" (index ${idx}): ${pdfErr.message}`
        );
        skippedFiles.push({
          index: idx,
          name: file.originalname,
          reason: pdfErr.message,
        });
      }
    }

    if (totalPages === 0) {
      return res.status(400).json({
        success: false,
        error: "No pages could be extracted. All files may be corrupted.",
        skippedFiles,
      });
    }

    // ----- Save merged PDF and encode as Base64 ---------------------------
    const mergedBytes = await mergedPdf.save();
    const base64Pdf = Buffer.from(mergedBytes).toString("base64");

    // ----- Respond -------------------------------------------------------
    const response = {
      success: true,
      pdf: base64Pdf,
      pageCount: totalPages,
      fileCount: order.length - skippedFiles.length,
    };

    if (skippedFiles.length > 0) {
      response.skippedFiles = skippedFiles;
    }

    return res.json(response);
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: err.message });
    }

    return next(err);
  }
});

// ---------------------------------------------------------------------------
// Multer error handler for this router (e.g. file-filter rejections)
// ---------------------------------------------------------------------------
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message.includes("Invalid file type")) {
    return res.status(400).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: err.message });
});

module.exports = router;
