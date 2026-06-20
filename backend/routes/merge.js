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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fsSync = require("fs");
    if (!fsSync.existsSync(uploadsDir)) {
      fsSync.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Prefix with timestamp + uuid fragment to avoid collisions
    const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

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
// Helper – delete an array of file paths (best-effort, never throws)
// ---------------------------------------------------------------------------
async function cleanUpFiles(filePaths) {
  await Promise.allSettled(
    filePaths.map((fp) => fs.unlink(fp).catch(() => {}))
  );
}

// ---------------------------------------------------------------------------
// POST /api/merge
// Accepts up to 20 PDF files via the "files" field and an optional "order"
// field (JSON array of indices) that controls the merge sequence.
// ---------------------------------------------------------------------------
router.post("/merge", upload.array("files", 20), async (req, res, next) => {
  // Collect uploaded file paths so we can clean up no matter what happens
  const uploadedPaths = (req.files || []).map((f) => f.path);

  try {
    // ----- Validation --------------------------------------------------
    if (!req.files || req.files.length < 2) {
      await cleanUpFiles(uploadedPaths);
      return res.status(400).json({
        success: false,
        error: "At least 2 PDF files are required for merging.",
      });
    }

    // Double-check MIME types (belt-and-suspenders alongside the fileFilter)
    const nonPdf = req.files.filter((f) => f.mimetype !== "application/pdf");
    if (nonPdf.length > 0) {
      await cleanUpFiles(uploadedPaths);
      return res.status(400).json({
        success: false,
        error: `Non-PDF files detected: ${nonPdf.map((f) => f.originalname).join(", ")}`,
      });
    }

    // ----- Determine merge order ----------------------------------------
    let order;
    if (req.body.order) {
      // order may arrive as a JSON string or as an array (depending on client)
      order = typeof req.body.order === "string"
        ? JSON.parse(req.body.order)
        : req.body.order;
    } else {
      // Default: use the upload order (0, 1, 2, …)
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
        const pdfBytes = await fs.readFile(file.path);
        const srcDoc = await PDFDocument.load(pdfBytes, {
          // Attempt to repair minor issues; skip truly broken files below
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
        // File is corrupted or unreadable – skip it and continue
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

    // If every file was bad we have nothing to return
    if (totalPages === 0) {
      await cleanUpFiles(uploadedPaths);
      return res.status(400).json({
        success: false,
        error: "No pages could be extracted. All files may be corrupted.",
        skippedFiles,
      });
    }

    // ----- Save merged PDF -----------------------------------------------
    const mergedBytes = await mergedPdf.save();
    const outputName = `${uuidv4()}.pdf`;
    const fsSync = require("fs");
    if (!fsSync.existsSync(mergedDir)) {
      fsSync.mkdirSync(mergedDir, { recursive: true });
    }
    const outputPath = path.join(mergedDir, outputName);

    await fs.writeFile(outputPath, mergedBytes);

    // ----- Clean up uploaded files ----------------------------------------
    await cleanUpFiles(uploadedPaths);

    // ----- Schedule automatic deletion of merged file after 10 minutes ----
    const TEN_MINUTES = 10 * 60 * 1000;
    setTimeout(async () => {
      try {
        await fs.unlink(outputPath);
        console.log(`Auto-deleted merged file: ${outputName}`);
      } catch {
        // File may have already been deleted manually – ignore
      }
    }, TEN_MINUTES);

    // ----- Respond -------------------------------------------------------
    const response = {
      success: true,
      downloadUrl: `/downloads/${outputName}`,
      pageCount: totalPages,
      fileCount: order.length - skippedFiles.length,
    };

    // Include skipped files info only when relevant
    if (skippedFiles.length > 0) {
      response.skippedFiles = skippedFiles;
    }

    return res.json(response);
  } catch (err) {
    // Unexpected error – clean up and forward to global handler
    await cleanUpFiles(uploadedPaths);

    // Multer errors (file too large, too many files, etc.)
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
