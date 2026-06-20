import { useState, useRef, useCallback } from 'react';
import { Upload, FileUp } from 'lucide-react';

/**
 * UploadZone — drag-and-drop + click-to-browse area for PDF files.
 * Validates that all dropped/selected files are PDFs.
 */
export default function UploadZone({ onFilesAdded }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  /** Validate that files are PDFs */
  const validateAndAdd = useCallback(
    (fileList) => {
      const files = Array.from(fileList);
      const invalidFiles = files.filter(
        (f) => !f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf'
      );

      if (invalidFiles.length > 0) {
        setError(`Only PDF files are accepted. Rejected: ${invalidFiles.map((f) => f.name).join(', ')}`);
        setTimeout(() => setError(''), 4000);
        // Still add the valid ones
        const validFiles = files.filter(
          (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
        );
        if (validFiles.length > 0) onFilesAdded(validFiles);
        return;
      }

      setError('');
      onFilesAdded(files);
    },
    [onFilesAdded]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files?.length > 0) {
        validateAndAdd(e.dataTransfer.files);
      }
    },
    [validateAndAdd]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      validateAndAdd(e.target.files);
      // Reset input so the same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div className="animate-fade-in">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer rounded-2xl border-2 border-dashed 
          transition-all duration-300 ease-out
          ${
            isDragOver
              ? 'border-primary-400 bg-primary-500/10 scale-[1.02] shadow-lg shadow-primary-500/10'
              : 'border-surface-700 dark:border-surface-700 hover:border-primary-500/50 hover:bg-white/[0.02]'
          }
          p-12 sm:p-16 flex flex-col items-center justify-center text-center
        `}
      >
        {/* Animated icon */}
        <div
          className={`
            mb-6 p-4 rounded-2xl transition-all duration-300
            ${isDragOver 
              ? 'bg-primary-500/20 scale-110' 
              : 'bg-white/5 group-hover:bg-primary-500/10 group-hover:scale-105'}
          `}
        >
          {isDragOver ? (
            <FileUp className="w-10 h-10 text-primary-400 animate-bounce" />
          ) : (
            <Upload className="w-10 h-10 text-surface-300 dark:text-surface-300 group-hover:text-primary-400 transition-colors duration-300" />
          )}
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-white dark:text-white mb-2 transition-colors">
          {isDragOver ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
        </h3>
        <p className="text-sm text-surface-300 dark:text-surface-300 mb-1">
          or{' '}
          <span className="text-primary-400 font-medium hover:text-primary-300 transition-colors">
            click to browse
          </span>
        </p>
        <p className="text-xs text-surface-700 dark:text-surface-700 mt-2">
          PDF files only • Max 50MB total
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Error toast */}
      {error && (
        <div className="mt-3 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
