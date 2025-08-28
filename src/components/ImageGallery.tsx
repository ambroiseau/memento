import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

export function ImageGallery({ 
  galleryImages, 
  currentImageIndex, 
  setCurrentImageIndex, 
  handleCloseGallery 
}) {
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  useEffect(() => {
    // Prevent body scroll when gallery is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        handleCloseGallery()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentImageIndex])

  const handleNext = () => {
    if (currentImageIndex < galleryImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    }
    if (isRightSwipe) {
      handlePrevious()
    }
  }

  const currentImage = galleryImages[currentImageIndex]

  if (!currentImage) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-60 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="text-sm opacity-80">
              {currentImageIndex + 1} of {galleryImages.length}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseGallery}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center p-4 pt-16 pb-20"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <ImageWithFallback
            src={currentImage.url}
            alt={`Gallery image ${currentImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {currentImageIndex > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}
      
      {currentImageIndex < galleryImages.length - 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12 rounded-full"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 z-60 bg-gradient-to-t from-black/50 to-transparent p-4">
        <div className="text-white text-center">
          {currentImage.author && (
            <div className="text-sm opacity-80 mb-1">
              Photo by {currentImage.author.name}
            </div>
          )}
          {currentImage.caption && (
            <div className="text-sm max-w-md mx-auto">
              {currentImage.caption}
            </div>
          )}
          {currentImage.createdAt && (
            <div className="text-xs opacity-60 mt-2">
              {new Date(currentImage.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {galleryImages.length > 1 && galleryImages.length <= 10 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex 
                  ? 'bg-white' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Swipe Hint */}
      {galleryImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-xs">
          Swipe left or right to navigate
        </div>
      )}
    </div>
  )
}