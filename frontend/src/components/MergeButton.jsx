import { useState, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Download, RefreshCw, Merge } from 'lucide-react';
import { mergePDFs } from '../api';

/**
 * MergeButton — handles the merge workflow: idle → uploading → processing → success/error.
 * Includes custom filename input and download functionality.
 */
export default function MergeButton({ files, onMergeComplete, onError }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | success | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [filename, setFilename] = useState('merged.pdf');

  const isDisabled = files.length < 2 || status === 'uploading' || status === 'processing';

  /** Initiate the merge process */
  const handleMerge = useCallback(async () => {
    if (isDisabled) return;

    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');
    setResult(null);

    try {
      // Extract raw File objects from our file wrappers
      const rawFiles = files.map((f) => f.file);

      const data = await mergePDFs(rawFiles, (percent) => {
        setProgress(percent);
        // Once upload reaches 100%, switch to "processing" state
        if (percent >= 100) {
          setStatus('processing');
        }
      });

      setResult(data);
      setStatus('success');
      onMergeComplete?.(data);
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong');
      setStatus('error');
      onError?.(err.message);
    }
  }, [files, isDisabled, onMergeComplete, onError]);

  /** Download the merged PDF with the custom filename */
  const handleDownload = useCallback(() => {
    if (!result?.downloadUrl) return;

    const link = document.createElement('a');
    link.href = result.downloadUrl;
    // Use custom filename, ensuring it ends with .pdf
    const downloadName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result, filename]);

  /** Reset to try again */
  const handleReset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setErrorMsg('');
  }, []);

  return (
    <div className="animate-slide-up space-y-4">
      {/* Filename input — shown before merge */}
      {(status === 'idle' || status === 'error') && (
        <div className="flex items-center gap-3">
          <label
            htmlFor="filename"
            className="text-sm font-medium text-surface-300 whitespace-nowrap"
          >
            Output filename:
          </label>
          <input
            id="filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10
                       text-white placeholder-surface-700
                       focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30
                       transition-all duration-200"
            placeholder="merged.pdf"
          />
        </div>
      )}

      {/* Merge button */}
      {(status === 'idle' || status === 'error') && (
        <button
          onClick={handleMerge}
          disabled={isDisabled}
          className={`
            w-full py-3.5 px-6 rounded-xl font-semibold text-sm
            flex items-center justify-center gap-2.5
            transition-all duration-300 ease-out
            ${
              isDisabled
                ? 'bg-surface-800 text-surface-700 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.01] active:scale-[0.99] animate-pulse-glow'
            }
          `}
        >
          <Merge className="w-4 h-4" />
          {files.length < 2
            ? 'Add at least 2 PDFs to merge'
            : `Merge ${files.length} PDFs`}
        </button>
      )}

      {/* Upload progress bar */}
      {status === 'uploading' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-300 font-medium">Uploading...</span>
            <span className="text-primary-400 font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing spinner */}
      {status === 'processing' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          <p className="text-sm font-medium text-surface-300">
            Merging your PDFs...
          </p>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && result && (
        <div className="p-6 rounded-xl bg-success-500/5 border border-success-500/20 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success-500/10">
              <CheckCircle2 className="w-6 h-6 text-success-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-success-400">
                PDF merged successfully!
              </h3>
              {result.pageCount && (
                <p className="text-xs text-surface-300 mt-0.5">
                  {result.pageCount} pages total
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm
                       bg-gradient-to-r from-success-500 to-success-400 text-white
                       shadow-lg shadow-success-500/25
                       hover:shadow-xl hover:shadow-success-500/30 hover:scale-[1.01]
                       active:scale-[0.99]
                       flex items-center justify-center gap-2
                       transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Download {filename.endsWith('.pdf') ? filename : `${filename}.pdf`}
          </button>

          <button
            onClick={handleReset}
            className="w-full py-2.5 px-6 rounded-xl text-sm font-medium
                       text-surface-300 hover:text-white bg-white/5 hover:bg-white/10
                       border border-white/10 hover:border-white/20
                       transition-all duration-200
                       flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Merge more PDFs
          </button>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="p-4 rounded-xl bg-danger-500/5 border border-danger-500/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
            <p className="text-sm text-danger-400">{errorMsg}</p>
          </div>
          <button
            onClick={handleMerge}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-surface-300
                       hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
