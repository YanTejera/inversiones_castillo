import React, { useState, useRef, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallbackSrc?: string;
  blurHash?: string;
  aspectRatio?: number;
  showLoader?: boolean;
  fadeInDuration?: number;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  containerClassName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallbackSrc,
  blurHash,
  aspectRatio,
  showLoader = true,
  fadeInDuration = 300,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    const container = containerRef.current;
    if (container) {
      observer.observe(container);
    }

    return () => {
      if (container) {
        observer.unobserve(container);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      setIsError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setIsError(true);
      if (fallbackSrc && fallbackSrc !== src) {
        setCurrentSrc(fallbackSrc);
        setIsLoaded(true);
      }
      onError?.();
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, fallbackSrc, onLoad, onError]);

  // Generate placeholder styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    ...(aspectRatio && { aspectRatio: aspectRatio.toString() })
  };

  const imageStyles: React.CSSProperties = {
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
    opacity: isLoaded ? 1 : 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    ...props.style
  };

  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
    opacity: isLoaded ? 0 : 1,
    pointerEvents: isLoaded ? 'none' : 'auto'
  };

  // BlurHash placeholder (if provided)
  const blurHashStyles: React.CSSProperties = blurHash ? {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `url("data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="8"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#${blurHash}" filter="url(#blur)"/>
      </svg>
    `)}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: `opacity ${fadeInDuration}ms ease-in-out`,
    opacity: isLoaded ? 0 : 0.7
  } : {};

  const renderPlaceholder = () => {
    if (isError && !fallbackSrc) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
          <AlertCircle className="h-8 w-8" />
          <span className="text-xs text-center">Error al cargar imagen</span>
        </div>
      );
    }

    if (!isInView || (!isLoaded && !isError)) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
          {showLoader && (
            <>
              <ImageIcon className={`h-8 w-8 ${isInView ? 'animate-pulse' : ''}`} />
              {isInView && <span className="text-xs">Cargando...</span>}
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      className={`lazy-image-container ${containerClassName}`}
      style={containerStyles}
    >
      {/* BlurHash background */}
      {blurHash && <div style={blurHashStyles} />}
      
      {/* Placeholder */}
      <div style={placeholderStyles}>
        {renderPlaceholder()}
      </div>

      {/* Actual Image */}
      {(isInView || placeholder) && (
        <img
          ref={imgRef}
          src={currentSrc || src}
          alt={alt}
          className={`lazy-image ${className}`}
          style={imageStyles}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}

      {/* Loading overlay for when switching from placeholder to actual image */}
      {isInView && !isLoaded && !isError && showLoader && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75"
          style={{ transition: `opacity ${fadeInDuration}ms ease-in-out` }}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="text-xs text-gray-600">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;