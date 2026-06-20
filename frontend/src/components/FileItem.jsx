import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, X } from 'lucide-react';

/**
 * Format bytes into a human-readable string (KB / MB).
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * FileItemContent — the visual card layout shared between the
 * sortable item and the DragOverlay. Extracted so both render identically.
 */
export function FileItemContent({ file, index, onRemove, isOverlay = false }) {
  return (
    <div
      className={`
        group flex items-center gap-3 px-4 py-3 rounded-xl
        transition-all duration-200 ease-out
        ${isOverlay
          ? 'bg-surface-850 border-2 border-primary-500/40 shadow-2xl shadow-primary-500/20 scale-[1.02] cursor-grabbing'
          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'}
      `}
    >
      {/* Drag handle */}
      <div className="flex-shrink-0 p-1 rounded-lg text-surface-700">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* File icon */}
      <div className="flex-shrink-0 p-2 rounded-lg bg-primary-500/10">
        <FileText className="w-4 h-4 text-primary-400" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-surface-700 mt-0.5">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Index badge */}
      <span className="flex-shrink-0 text-xs font-medium text-surface-700 bg-white/5 
                       px-2 py-0.5 rounded-full">
        #{index + 1}
      </span>

      {/* Remove button — hidden in overlay */}
      {!isOverlay && (
        <button
          onClick={() => onRemove?.(file.id)}
          className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                     text-surface-700 hover:text-danger-400 hover:bg-danger-500/10
                     transition-all duration-200"
          aria-label={`Remove ${file.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * FileItem — a single draggable file card in the list.
 * Uses @dnd-kit/sortable for drag-and-drop reordering.
 * When dragging, the original item becomes a faint placeholder
 * while the DragOverlay (in FileList) shows the elevated card.
 */
export default function FileItem({ file, onRemove, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  // IMPORTANT: Only use CSS.Translate (not CSS.Transform) to avoid scale/rotation
  // artifacts. Do NOT put CSS animations with transforms on this wrapper —
  // they conflict with dnd-kit's inline transform and cause the overlay to
  // jump to the wrong position.
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <FileItemContent file={file} index={index} onRemove={onRemove} />
    </div>
  );
}
