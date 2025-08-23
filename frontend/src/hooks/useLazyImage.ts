import { useState, useEffect, useRef } from 'react';

export interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  fallbackSrc?: string;
  placeholder?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface UseLazyImageReturn {
  isLoaded: boolean;
  isError: boolean;
  isInView: boolean;
  currentSrc: string;
  retry: () => void;
  ref: React.RefObject<HTMLElement>;
}

export const useLazyImage = (
  src: string,
  options: UseLazyImageOptions = {}
): UseLazyImageReturn => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    fallbackSrc,
    placeholder,
    retryAttempts = 2,
    retryDelay = 1000
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [attemptCount, setAttemptCount] = useState(0);
  
  const ref = useRef<HTMLElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Intersection Observer
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
      { threshold, rootMargin }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // Load image
  const loadImage = (imageSrc: string, attempt: number = 0) => {
    if (!imageSrc) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(imageSrc);
      setIsLoaded(true);
      setIsError(false);
      setAttemptCount(0);
    };

    img.onerror = () => {
      if (attempt < retryAttempts) {
        retryTimeoutRef.current = setTimeout(() => {
          loadImage(imageSrc, attempt + 1);
          setAttemptCount(attempt + 1);
        }, retryDelay * (attempt + 1)); // Exponential backoff
      } else {
        setIsError(true);
        if (fallbackSrc && fallbackSrc !== imageSrc) {
          loadImage(fallbackSrc, 0);
        }
      }
    };

    img.src = imageSrc;
  };

  // Load image when in view
  useEffect(() => {
    if (isInView && src && !isLoaded && !isError) {
      loadImage(src);
    }
  }, [isInView, src]);

  // Retry function
  const retry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setIsLoaded(false);
    setIsError(false);
    setAttemptCount(0);
    loadImage(src);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoaded,
    isError,
    isInView,
    currentSrc,
    retry,
    ref
  };
};

// Hook for preloading images
export const useImagePreload = (urls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    };

    const preloadAll = async () => {
      const promises = urls.map(url => 
        preloadImage(url)
          .then(url => {
            setLoadedImages(prev => new Set(prev).add(url));
            return { success: true, url };
          })
          .catch(url => {
            setFailedImages(prev => new Set(prev).add(url));
            return { success: false, url };
          })
      );

      await Promise.allSettled(promises);
    };

    if (urls.length > 0) {
      preloadAll();
    }
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    isFailed: (url: string) => failedImages.has(url)
  };
};

// Hook for responsive image loading
export interface UseResponsiveImageOptions {
  breakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  sizes?: string;
  quality?: number;
}

export const useResponsiveImage = (
  baseSrc: string,
  options: UseResponsiveImageOptions = {}
) => {
  const {
    breakpoints = {
      sm: '640w',
      md: '768w', 
      lg: '1024w',
      xl: '1280w'
    },
    sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw',
    quality = 75
  } = options;

  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setCurrentBreakpoint('sm');
      else if (width < 768) setCurrentBreakpoint('md');
      else if (width < 1024) setCurrentBreakpoint('lg');
      else setCurrentBreakpoint('xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  // Generate srcSet from breakpoints
  const srcSet = Object.entries(breakpoints)
    .map(([key, value]) => {
      const size = value.replace('w', '');
      // This would typically integrate with an image service like Cloudinary
      // For now, we'll return the original image
      return `${baseSrc} ${value}`;
    })
    .join(', ');

  return {
    src: baseSrc,
    srcSet,
    sizes,
    currentBreakpoint
  };
};

// Utility functions for image optimization
export const imageUtils = {
  // Generate placeholder data URL
  generatePlaceholder: (width: number = 400, height: number = 300, color: string = '#f3f4f6') => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL();
  },

  // Generate blur hash placeholder
  generateBlurHash: (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Create small canvas for blur hash
        canvas.width = 4;
        canvas.height = 4;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, 4, 4);
          const imageData = ctx.getImageData(0, 0, 4, 4);
          
          // Simple average color calculation
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < imageData.data.length; i += 4) {
            r += imageData.data[i];
            g += imageData.data[i + 1];
            b += imageData.data[i + 2];
          }
          
          const pixelCount = imageData.data.length / 4;
          r = Math.floor(r / pixelCount);
          g = Math.floor(g / pixelCount);
          b = Math.floor(b / pixelCount);
          
          const hash = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
          resolve(hash);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageUrl;
    });
  },

  // Compress image file
  compressImage: (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        if (ctx) {
          // Draw and compress
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            file.type,
            quality
          );
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
};