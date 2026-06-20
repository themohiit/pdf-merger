# 📄 PDF Merger

A modern, full-stack web application to merge multiple PDF files into one. Features drag-and-drop upload, reorderable file list, and a premium dark-mode UI.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-purple)

## ✨ Features

- **Upload PDFs** — Drag & drop or click to browse. Supports multiple files.
- **Reorder** — Drag-and-drop to rearrange merge order.
- **Merge** — One-click merge with real-time progress tracking.
- **Download** — Instant download of the merged PDF with custom filename.
- **Dark Mode** — Toggle between light and dark themes (persisted).
- **Responsive** — Works beautifully on desktop, tablet, and mobile.
- **Error Handling** — Validates file types, sizes, and handles corrupted PDFs.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Drag & Drop | @dnd-kit |
| Backend | Express.js |
| PDF Merging | pdf-lib |
| File Upload | Multer |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher

### 1. Clone the repository

```bash
cd /path/to/pdf-merger
```

### 2. Install & start the backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on **http://localhost:5000**.

### 3. Install & start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:5173**.

### 4. Open your browser

Navigate to **http://localhost:5173** and start merging PDFs!

## 📡 API Reference

### `POST /api/merge`

Merge multiple PDF files into one.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `files` | File[] | PDF files to merge (2-20 files, 50MB max total) |
| `order` | string | JSON array of indices specifying merge order |

**Response:**

```json
{
  "success": true,
  "downloadUrl": "/downloads/abc123.pdf",
  "pageCount": 15,
  "fileCount": 3
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

### `GET /downloads/:filename`

Download a merged PDF file. Files are automatically cleaned up after 10 minutes.

## 📁 Project Structure

```
pdf-merger/
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx    # Drag-and-drop file upload
│   │   │   ├── FileList.jsx      # Sortable file list
│   │   │   ├── FileItem.jsx      # Individual file entry
│   │   │   ├── MergeButton.jsx   # Merge trigger + download
│   │   │   └── DarkModeToggle.jsx
│   │   ├── App.jsx               # Root component
│   │   ├── api.js                # API integration
│   │   └── index.css             # Tailwind + custom styles
│   ├── index.html
│   └── vite.config.js
│
├── backend/                 # Express.js backend
│   ├── routes/
│   │   └── merge.js         # Merge endpoint
│   ├── uploads/             # Temporary upload storage
│   ├── merged/              # Merged PDF output
│   └── server.js            # Express server
│
└── README.md
```

## ⚙️ Configuration

| Setting | Default | Location |
|---------|---------|----------|
| Backend port | 5000 | `backend/server.js` |
| Frontend port | 5173 | Vite default |
| Max file size | 50 MB | `backend/routes/merge.js` |
| Max file count | 20 | `backend/routes/merge.js` |
| Merged file TTL | 10 min | `backend/routes/merge.js` |

## 📝 License

MIT
