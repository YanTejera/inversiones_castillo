import React from 'react';
import ImageGallery from '../ImageGallery';
import LazyImage from '../LazyImage';
import { imageUtils } from '../../hooks/useLazyImage';

// Example component demonstrating image optimization features
const ImageGalleryExample: React.FC = () => {
  // Sample images - in real app these would come from API
  const sampleImages = [
    {
      id: '1',
      src: 'https://picsum.photos/800/600?random=1',
      thumbnail: 'https://picsum.photos/200/150?random=1',
      alt: 'Motocicleta Deportiva',
      title: 'Yamaha YZF-R6 2023',
      description: 'Motocicleta deportiva de alto rendimiento'
    },
    {
      id: '2',
      src: 'https://picsum.photos/800/600?random=2',
      thumbnail: 'https://picsum.photos/200/150?random=2',
      alt: 'Motocicleta Cruiser',
      title: 'Harley-Davidson Street 750',
      description: 'Motocicleta cruiser clásica americana'
    },
    {
      id: '3',
      src: 'https://picsum.photos/800/600?random=3',
      thumbnail: 'https://picsum.photos/200/150?random=3',
      alt: 'Motocicleta Adventure',
      title: 'BMW GS 1250',
      description: 'Motocicleta de aventura para todo terreno'
    },
    {
      id: '4',
      src: 'https://picsum.photos/800/600?random=4',
      thumbnail: 'https://picsum.photos/200/150?random=4',
      alt: 'Motocicleta Naked',
      title: 'Kawasaki Z900',
      description: 'Motocicleta naked urbana'
    },
    {
      id: '5',
      src: 'https://picsum.photos/800/600?random=5',
      thumbnail: 'https://picsum.photos/200/150?random=5',
      alt: 'Motocicleta Scooter',
      title: 'Vespa Primavera 150',
      description: 'Scooter urbano elegante'
    },
    {
      id: '6',
      src: 'https://picsum.photos/800/600?random=6',
      thumbnail: 'https://picsum.photos/200/150?random=6',
      alt: 'Motocicleta Eléctrica',
      title: 'Zero SR/F',
      description: 'Motocicleta eléctrica de última generación'
    }
  ];

  const [uploadedImages, setUploadedImages] = React.useState<File[]>([]);
  const [compressedImages, setCompressedImages] = React.useState<File[]>([]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedImages(files);

    // Compress images
    const compressed = await Promise.all(
      files.map(file => imageUtils.compressImage(file, 1200, 0.8))
    );
    setCompressedImages(compressed);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Optimización de Imágenes
        </h1>
        <p className="text-gray-600">
          Ejemplos de lazy loading, compresión y galería de imágenes optimizada
        </p>
      </div>

      {/* Individual Lazy Images */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Lazy Loading Individual</h2>
        <p className="text-gray-600">
          Estas imágenes se cargan solo cuando entran en el viewport
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleImages.slice(0, 3).map((image) => (
            <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <LazyImage
                src={image.src}
                alt={image.alt}
                aspectRatio={16/9}
                placeholder={image.thumbnail}
                showLoader={true}
                fadeInDuration={500}
                className="hover:scale-105 transition-transform duration-300"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{image.title}</h3>
                <p className="text-sm text-gray-600">{image.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Image Gallery */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Galería de Imágenes</h2>
        <p className="text-gray-600">
          Galería completa con lightbox, navegación por teclado y zoom
        </p>
        
        <ImageGallery
          images={sampleImages}
          columns={3}
          aspectRatio={4/3}
          enableLightbox={true}
          showThumbnails={true}
          preloadNext={2}
          className="bg-white p-4 rounded-lg shadow-md"
        />
      </section>

      {/* Image Upload and Compression */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Compresión de Imágenes</h2>
        <p className="text-gray-600">
          Sube imágenes para ver la compresión automática en acción
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Imágenes
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Resultados de Compresión</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedImages.map((file, index) => {
                  const compressed = compressedImages[index];
                  const originalSize = file.size;
                  const compressedSize = compressed?.size || 0;
                  const savings = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100) : 0;

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate">{file.name}</span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Tamaño original:</span>
                          <span>{formatFileSize(originalSize)}</span>
                        </div>
                        {compressed && (
                          <>
                            <div className="flex justify-between">
                              <span>Tamaño comprimido:</span>
                              <span>{formatFileSize(compressedSize)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-green-600">
                              <span>Ahorro:</span>
                              <span>{savings.toFixed(1)}%</span>
                            </div>
                          </>
                        )}
                      </div>

                      {compressed && (
                        <div className="mt-4">
                          <LazyImage
                            src={URL.createObjectURL(compressed)}
                            alt={`Compressed ${file.name}`}
                            aspectRatio={16/9}
                            showLoader={true}
                            className="rounded"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Performance Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Características del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Lazy Loading</h3>
            <p className="text-blue-800 text-sm">
              Las imágenes se cargan solo cuando son visibles, reduciendo el tiempo de carga inicial
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Compresión Automática</h3>
            <p className="text-green-800 text-sm">
              Reduce automáticamente el tamaño de las imágenes sin perder calidad visual
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Gestión de Errores</h3>
            <p className="text-purple-800 text-sm">
              Fallbacks automáticos y reintentos cuando las imágenes fallan al cargar
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">Preload Inteligente</h3>
            <p className="text-orange-800 text-sm">
              Precarga imágenes siguientes para una navegación más fluida
            </p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">Lightbox Avanzado</h3>
            <p className="text-red-800 text-sm">
              Zoom, rotación, navegación por teclado y descarga de imágenes
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Responsive</h3>
            <p className="text-gray-800 text-sm">
              Soporte para diferentes tamaños de pantalla y densidades de píxeles
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ImageGalleryExample;