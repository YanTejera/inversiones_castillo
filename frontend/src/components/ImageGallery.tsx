import React, { useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from './LazyImage';
import { useImagePreload } from '../hooks/useLazyImage';

interface ImageItem {
  id: string;
  src: string;
  thumbnail?: string;
  alt: string;
  title?: string;
  description?: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  columns?: number;
  gap?: number;
  aspectRatio?: number;
  showThumbnails?: boolean;
  enableLightbox?: boolean;
  preloadNext?: number;
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 4,
  aspectRatio = 16/9,
  showThumbnails = true,
  enableLightbox = true,
  preloadNext = 2,
  className = ''
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Preload next few images for better UX
  const preloadUrls = React.useMemo(() => {
    if (selectedImageIndex === null) return [];
    
    const urls: string[] = [];
    for (let i = 1; i <= preloadNext; i++) {
      const nextIndex = selectedImageIndex + i;
      const prevIndex = selectedImageIndex - i;
      
      if (nextIndex < images.length) {
        urls.push(images[nextIndex].src);
      }
      if (prevIndex >= 0) {
        urls.push(images[prevIndex].src);
      }
    }
    return urls;
  }, [selectedImageIndex, images, preloadNext]);

  const { loadedImages } = useImagePreload(preloadUrls);

  const openLightbox = useCallback((index: number) => {
    if (enableLightbox) {
      setSelectedImageIndex(index);
      setLightboxScale(1);
      setLightboxRotation(0);
      document.body.style.overflow = 'hidden';
    }
  }, [enableLightbox]);

  const closeLightbox = useCallback(() => {
    setSelectedImageIndex(null);
    setLightboxScale(1);
    setLightboxRotation(0);
    document.body.style.overflow = 'auto';
  }, []);

  const navigateLightbox = useCallback((direction: 'next' | 'prev') => {
    if (selectedImageIndex === null) return;

    if (direction === 'next' && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    } else if (direction === 'prev' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
    
    setLightboxScale(1);
    setLightboxRotation(0);
  }, [selectedImageIndex, images.length]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (selectedImageIndex === null) return;
    
    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox('prev');
        break;
      case 'ArrowRight':
        navigateLightbox('next');
        break;
      case '+':
      case '=':
        setLightboxScale(prev => Math.min(prev * 1.2, 3));
        break;
      case '-':
        setLightboxScale(prev => Math.max(prev / 1.2, 0.5));
        break;
      case 'r':
      case 'R':
        setLightboxRotation(prev => prev + 90);
        break;
    }
  }, [selectedImageIndex, closeLightbox, navigateLightbox]);

  React.useEffect(() => {
    if (selectedImageIndex !== null) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [selectedImageIndex, handleKeyPress]);

  const downloadImage = useCallback((imageUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap * 0.25}rem`
  };

  return (
    <div className={className}>
      {/* Gallery Grid */}
      <div style={gridStyles} className="gallery-grid">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="gallery-item group cursor-pointer relative overflow-hidden rounded-lg bg-gray-100"
            onClick={() => openLightbox(index)}
          >
            <LazyImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              aspectRatio={aspectRatio}
              className="transition-transform duration-300 group-hover:scale-110"
              containerClassName="w-full h-full"
              showLoader={true}
              fadeInDuration={300}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Image Info */}
            {image.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{image.title}</p>
                {image.description && (
                  <p className="text-white text-xs opacity-90 truncate">{image.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {enableLightbox && selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            <button
              onClick={() => setLightboxScale(prev => Math.min(prev * 1.2, 3))}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLightboxScale(prev => Math.max(prev / 1.2, 0.5))}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLightboxRotation(prev => prev + 90)}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              title="Rotate"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => downloadImage(images[selectedImageIndex].src, images[selectedImageIndex].alt)}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={closeLightbox}
              className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          {selectedImageIndex > 0 && (
            <button
              onClick={() => navigateLightbox('prev')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
              title="Previous Image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          
          {selectedImageIndex < images.length - 1 && (
            <button
              onClick={() => navigateLightbox('next')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
              title="Next Image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Main Image */}
          <div className="flex items-center justify-center w-full h-full p-4">
            <img
              src={images[selectedImageIndex].src}
              alt={images[selectedImageIndex].alt}
              className="max-w-full max-h-full object-contain transition-all duration-300 cursor-move"
              style={{
                transform: `scale(${lightboxScale}) rotate(${lightboxRotation}deg)`
              }}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex + 1} de {images.length}
          </div>

          {/* Image Info */}
          {images[selectedImageIndex].title && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg max-w-sm">
              <h3 className="font-medium">{images[selectedImageIndex].title}</h3>
              {images[selectedImageIndex].description && (
                <p className="text-sm opacity-90 mt-1">{images[selectedImageIndex].description}</p>
              )}
            </div>
          )}

          {/* Thumbnails */}
          {showThumbnails && images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-lg max-w-full overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <LazyImage
                    src={image.thumbnail || image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    showLoader={false}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Click overlay to close */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          />
        </div>
      )}
    </div>
  );
};

export default ImageGallery;