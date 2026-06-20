import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Trash2 } from 'lucide-react';
import FileItem, { FileItemContent } from './FileItem';

/**
 * Format bytes into a human-readable string.
 */
function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * FileList — sortable list of uploaded PDFs with drag-and-drop reordering.
 * Uses @dnd-kit for accessible, performant drag-and-drop.
 */
export default function FileList({ files, setFiles, onRemoveFile, onClearAll }) {
  const [activeId, setActiveId] = useState(null);

  // Configure sensors for pointer and keyboard-based dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // 5px dead zone to avoid accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);

      if (active.id !== over?.id) {
        setFiles((prev) => {
          const oldIndex = prev.findIndex((f) => f.id === active.id);
          const newIndex = prev.findIndex((f) => f.id === over.id);
          return arrayMove(prev, oldIndex, newIndex);
        });
      }
    },
    [setFiles]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Find the active file for the drag overlay
  const activeFile = activeId ? files.find((f) => f.id === activeId) : null;

  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (files.length === 0) return null;

  return (
    <div className="animate-slide-up">
      {/* Header with file count, total size, and clear button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </h2>
          <span className="text-xs text-surface-700 bg-white/5 px-2.5 py-1 rounded-full">
            {formatFileSize(totalSize)}
          </span>
        </div>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-surface-300 hover:text-danger-400 hover:bg-danger-500/10
                     border border-transparent hover:border-danger-500/20
                     transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All
        </button>
      </div>

      {/* Sortable file list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {files.map((file, index) => (
              <FileItem
                key={file.id}
                file={file}
                index={index}
                onRemove={onRemoveFile}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay — portalled to body to escape parent layout/stacking contexts */}
        {createPortal(
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.25' } },
              }),
            }}
          >
            {activeFile ? (
              <FileItemContent
                file={activeFile}
                index={files.findIndex((f) => f.id === activeFile.id)}
                isOverlay
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Reorder hint */}
      <p className="mt-3 text-xs text-surface-700 text-center">
        Drag and drop to reorder • Files merge top to bottom
      </p>
    </div>
  );
}
