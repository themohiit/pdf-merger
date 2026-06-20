import { useState, useCallback } from 'react';
import { FileStack } from 'lucide-react';
import DarkModeToggle from './components/DarkModeToggle';
import UploadZone from './components/UploadZone';
import FileList from './components/FileList';
import MergeButton from './components/MergeButton';

/** Maximum total file size: 50MB */
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export default function App() {
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState(null);

  /** Show a temporary notification toast */
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  /** Add new files — generate unique IDs, validate total size */
  const addFiles = useCallback(
    (newFiles) => {
      const wrapped = newFiles.map((file) => ({
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        size: file.size,
      }));

      setFiles((prev) => {
        const combined = [...prev, ...wrapped];
        // Validate total size doesn't exceed 50MB
        const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
        if (totalSize > MAX_TOTAL_SIZE) {
          showNotification(
            `Total size exceeds 50MB limit (${(totalSize / (1024 * 1024)).toFixed(1)}MB). Remove some files.`,
            'error'
          );
          return prev; // Don't add the new files
        }
        return combined;
      });
    },
    [showNotification]
  );

  /** Remove a single file by its unique ID */
  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /** Clear all files */
  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  /** Handle successful merge */
  const handleMergeComplete = useCallback(
    (result) => {
      showNotification('PDFs merged successfully!', 'success');
    },
    [showNotification]
  );

  /** Handle merge error */
  const handleMergeError = useCallback(
    (errorMsg) => {
      showNotification(errorMsg || 'Merge failed', 'error');
    },
    [showNotification]
  );

  return (
    <div className="min-h-screen bg-surface-950 text-white transition-colors duration-300">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-purple-900/5 pointer-events-none" />

      {/* Notification toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-xl backdrop-blur-xl border text-sm font-medium shadow-xl
              ${notification.type === 'error' 
                ? 'bg-danger-500/10 border-danger-500/20 text-danger-400' 
                : notification.type === 'success'
                ? 'bg-success-500/10 border-success-500/20 text-success-400'
                : 'bg-primary-500/10 border-primary-500/20 text-primary-400'
              }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Header */}
        <header className="text-center mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-8">
            <div className="w-10" /> {/* Spacer for centering */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20">
                <FileStack className="w-6 h-6 text-primary-400" />
              </div>
            </div>
            <DarkModeToggle />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-purple-400 bg-clip-text text-transparent">
              PDF Merger
            </span>
          </h1>
          <p className="text-surface-300 text-base sm:text-lg max-w-md mx-auto">
            Combine multiple PDF files into a single document.
            <br className="hidden sm:block" />
            <span className="text-surface-700"> Drag to reorder. Fast and free.</span>
          </p>
        </header>

        {/* Main content */}
        <main className="space-y-6">
          {/* Upload zone — always visible */}
          <UploadZone onFilesAdded={addFiles} />

          {/* File list — shown when files are added */}
          {files.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]">
              <FileList
                files={files}
                setFiles={setFiles}
                onRemoveFile={removeFile}
                onClearAll={clearAll}
              />
            </div>
          )}

          {/* Merge button — shown when 1+ files, but enabled only for 2+ */}
          {files.length >= 1 && (
            <MergeButton
              files={files}
              onMergeComplete={handleMergeComplete}
              onError={handleMergeError}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-surface-700">
            Your files are processed securely and never stored permanently.
          </p>
        </footer>
      </div>
    </div>
  );
}
