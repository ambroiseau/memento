import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DraggableImage {
  id: string;
  file: File;
  preview: string;
  uploadedUrl?: string;
}

interface DraggableImageGridProps {
  images: DraggableImage[];
  onImagesReorder: (images: DraggableImage[]) => void;
  onRemoveImage: (imageId: string) => void;
}

export function DraggableImageGrid({
  images,
  onImagesReorder,
  onRemoveImage,
}: DraggableImageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartIndex = useRef<number>(-1);

  // Handle mouse drag events (desktop)
  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setDraggedIndex(index);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedIndex === null) return;

    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseY = e.clientY - rect.top;
    const itemHeight = rect.height / images.length;
    const newIndex = Math.floor(mouseY / itemHeight);
    
    if (newIndex !== dragOverIndex && newIndex >= 0 && newIndex < images.length) {
      setDragOverIndex(newIndex);
    }
  };

  const handleMouseUp = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...images];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, draggedItem);
      onImagesReorder(newImages);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Handle touch events (mobile)
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartIndex.current = index;
    setDraggedIndex(index);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || draggedIndex === null) return;

    const touch = e.touches[0];
    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touchY = touch.clientY - rect.top;
    const itemHeight = rect.height / images.length;
    const newIndex = Math.floor(touchY / itemHeight);
    
    if (newIndex !== dragOverIndex && newIndex >= 0 && newIndex < images.length) {
      setDragOverIndex(newIndex);
    }
  };

  const handleTouchEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...images];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, draggedItem);
      onImagesReorder(newImages);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Add global event listeners for mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, draggedIndex, dragOverIndex]);

  if (images.length === 0) return null;

  return (
    <div
      ref={dragRef}
      className="grid grid-cols-2 gap-3"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((image, index) => {
        const isDragged = index === draggedIndex;
        const isDragOver = index === dragOverIndex;
        
        return (
          <div
            key={image.id}
            className={`relative group transition-all duration-200 ${
              isDragged ? 'opacity-50 scale-95 z-10' : ''
            } ${
              isDragOver && !isDragged ? 'scale-105' : ''
            }`}
            style={{
              transform: isDragged ? 'rotate(5deg)' : '',
            }}
          >
            <div 
              className="relative cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleMouseDown(e, index)}
              onTouchStart={(e) => handleTouchStart(e, index)}
            >
              <ImageWithFallback
                src={image.preview}
                alt={`Image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg pointer-events-none"
              />

              {/* Remove Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(image.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Drag Overlay */}
            {isDragged && (
              <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
}
