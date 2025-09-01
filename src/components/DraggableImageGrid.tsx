import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';

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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const draggedElementRef = useRef<HTMLDivElement>(null);

  // Calculate the visual order of images during drag
  const getVisualOrder = () => {
    if (draggedIndex === null || dragOverIndex === null) {
      return images.map((_, index) => index);
    }

    const visualOrder = [...Array(images.length).keys()];

    if (draggedIndex !== dragOverIndex) {
      // Remove dragged item from its original position
      visualOrder.splice(draggedIndex, 1);

      // Insert dragged item at new position
      visualOrder.splice(dragOverIndex, 0, draggedIndex);
    }

    return visualOrder;
  };

  // Handle mouse drag events (desktop)
  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggedIndex(index);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedIndex === null) return;

    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate which position we're hovering over
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // For 2x2 grid, calculate position
    const itemWidth = rect.width / 2;
    const itemHeight = rect.height / 2;

    const col = Math.floor(mouseX / itemWidth);
    const row = Math.floor(mouseY / itemHeight);
    const newIndex = row * 2 + col;

    if (
      newIndex !== dragOverIndex &&
      newIndex >= 0 &&
      newIndex < images.length
    ) {
      setDragOverIndex(newIndex);
    }
  };

  const handleMouseUp = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newImages = [...images];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, draggedItem);
      onImagesReorder(newImages);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Handle touch events (mobile)
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setDraggedIndex(index);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || draggedIndex === null) return;

    e.preventDefault(); // Prevent scrolling during drag
    const touch = e.touches[0];
    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate which position we're hovering over
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // For 2x2 grid, calculate position
    const itemWidth = rect.width / 2;
    const itemHeight = rect.height / 2;

    const col = Math.floor(touchX / itemWidth);
    const row = Math.floor(touchY / itemHeight);
    const newIndex = row * 2 + col;

    if (
      newIndex !== dragOverIndex &&
      newIndex >= 0 &&
      newIndex < images.length
    ) {
      setDragOverIndex(newIndex);
    }
  };

  const handleTouchEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newImages = [...images];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, draggedItem);
      onImagesReorder(newImages);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  // Add global event listeners for mouse events and prevent scroll
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, draggedIndex, dragOverIndex]);

  // Function to prevent scroll during drag
  const preventScroll = (e: Event) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  if (images.length === 0) return null;

  const visualOrder = getVisualOrder();

  return (
    <div
      ref={dragRef}
      className="grid grid-cols-2 gap-3 relative"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: isDragging ? 'none' : 'pan-y',
        overscrollBehavior: 'none',
      }}
    >
      {visualOrder.map((originalIndex, visualIndex) => {
        const image = images[originalIndex];
        const isDragged = originalIndex === draggedIndex;
        const isDragOver = visualIndex === dragOverIndex;

        return (
          <div
            key={image.id}
            className={`relative group transition-all duration-300 ease-out ${
              isDragged ? 'z-50' : 'z-10'
            }`}
            style={{
              transform: isDragged
                ? `translate3d(${dragOffset.x - 64}px, ${dragOffset.y - 64}px, 0) scale(1.1) rotate(5deg)`
                : isDragOver && !isDragged
                  ? 'scale(0.95)'
                  : 'scale(1)',
              opacity: isDragged ? 0.8 : 1,
              willChange: isDragging ? 'transform' : 'auto',
            }}
          >
            <div
              className="relative cursor-grab active:cursor-grabbing"
              onMouseDown={e => handleMouseDown(e, originalIndex)}
              onTouchStart={e => handleTouchStart(e, originalIndex)}
            >
              <ImageWithFallback
                src={image.preview}
                alt={`Image ${originalIndex + 1}`}
                className="w-full h-32 object-cover rounded-lg pointer-events-none"
              />

              {/* Drag Overlay */}
              {isDragged && (
                <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg pointer-events-none" />
              )}
            </div>

            {/* Remove Button - Déplacé en dehors de la zone de drag */}
            <Button
              variant="destructive"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onRemoveImage(image.id);
              }}
              className="absolute top-2 right-2 w-6 h-6 p-0 z-30 bg-red-500 hover:bg-red-600 shadow-lg"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
