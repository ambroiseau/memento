import React, { useCallback, useEffect, useRef, useState } from 'react';
import { secureSignedUrls } from '../utils/secure-signed-urls';

// 🔒 Types sécurisés
interface OptimizedImageProps {
  originalUrl: string;
  displayUrl: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  securityContext: {
    userId: string;
    familyId: string;
  };
}

interface ImageState {
  currentUrl: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  isHighQuality: boolean;
}

/**
 * 🔒 Composant Image Optimisé et Sécurisé
 * Utilise le système de double stockage pour des performances optimales
 */
export function OptimizedImage({
  originalUrl,
  displayUrl,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onLoad,
  onError,
  securityContext,
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<ImageState>({
    currentUrl: '',
    isLoading: true,
    hasError: false,
    errorMessage: '',
    isHighQuality: false,
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isIntersecting = useRef(false);

  // 🔒 Validation de sécurité des props
  useEffect(() => {
    if (!securityContext?.userId || !securityContext?.familyId) {
      setImageState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: 'Contexte de sécurité invalide',
        isLoading: false,
      }));
      onError?.('Contexte de sécurité invalide');
      return;
    }

    if (!displayUrl && !originalUrl) {
      setImageState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: "Aucune URL d'image fournie",
        isLoading: false,
      }));
      onError?.("Aucune URL d'image fournie");
      return;
    }
  }, [securityContext, displayUrl, originalUrl, onError]);

  // 🔒 Chargement initial de l'image display (rapide)
  useEffect(() => {
    if (!displayUrl || imageState.hasError) return;

    const loadDisplayImage = async () => {
      try {
        setImageState(prev => ({ ...prev, isLoading: true, hasError: false }));

        // Générer l'URL signée pour l'image display
        const signedUrl = await secureSignedUrls.getDisplayImageUrl(
          displayUrl,
          { ...securityContext, operation: 'read' }
        );

        if (signedUrl) {
          setImageState(prev => ({
            ...prev,
            currentUrl: signedUrl,
            isLoading: false,
            isHighQuality: false,
          }));
        } else {
          throw new Error("Impossible de générer l'URL signée");
        }
      } catch (error) {
        // 🔒 Log sécurisé
        console.error('Failed to load display image:', displayUrl);
        setImageState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: "Échec du chargement de l'image",
          isLoading: false,
        }));
        onError?.("Échec du chargement de l'image");
      }
    };

    loadDisplayImage();
  }, [displayUrl, securityContext, onError]);

  // 🔒 Chargement de l'image originale en arrière-plan (si nécessaire)
  const loadHighQualityImage = useCallback(async () => {
    if (!originalUrl || imageState.isHighQuality || imageState.hasError) return;

    try {
      // Générer l'URL signée pour l'image originale
      const signedUrl = await secureSignedUrls.getOriginalImageUrl(
        originalUrl,
        { ...securityContext, operation: 'read' }
      );

      if (signedUrl) {
        setImageState(prev => ({
          ...prev,
          currentUrl: signedUrl,
          isHighQuality: true,
        }));
      }
    } catch (error) {
      // 🔒 Log sécurisé - ne pas exposer l'erreur à l'utilisateur
      console.warn('Failed to load high quality image');
    }
  }, [
    originalUrl,
    securityContext,
    imageState.isHighQuality,
    imageState.hasError,
  ]);

  // 🔒 Intersection Observer pour le lazy loading
  useEffect(() => {
    if (!imgRef.current || priority) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isIntersecting.current = true;
            // Charger l'image haute qualité quand elle devient visible
            loadHighQualityImage();
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Charger 50px avant que l'image soit visible
        threshold: 0.1,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadHighQualityImage, priority]);

  // 🔒 Gestion des événements d'image
  const handleImageLoad = useCallback(() => {
    setImageState(prev => ({ ...prev, isLoading: false }));
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      hasError: true,
      errorMessage: "Erreur de chargement de l'image",
      isLoading: false,
    }));
    onError?.("Erreur de chargement de l'image");
  }, [onError]);

  // 🔒 Nettoyage des URLs signées
  useEffect(() => {
    return () => {
      // Les URLs signées expirent automatiquement
      // Pas besoin de nettoyage manuel
    };
  }, []);

  // 🔒 Rendu de l'état d'erreur
  if (imageState.hasError) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center text-gray-500`}
        style={{ width, height }}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm">Image non disponible</span>
        </div>
      </div>
    );
  }

  // 🔒 Rendu de l'image
  return (
    <div className={`relative ${className}`}>
      {/* Skeleton de chargement */}
      {imageState.isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}

      {/* Image principale */}
      <img
        ref={imgRef}
        src={imageState.currentUrl}
        alt={alt}
        width={width}
        height={height}
        className={`
          ${imageState.isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
          ${priority ? 'priority' : 'lazy'}
        `}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ width, height }}
      />

      {/* Indicateur de qualité */}
      {imageState.isHighQuality && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          HD
        </div>
      )}

      {/* Indicateur de compression */}
      {imageState.currentUrl && !imageState.isHighQuality && (
        <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          Optimisé
        </div>
      )}
    </div>
  );
}

// 🔒 HOC pour ajouter le contexte de sécurité
export function withSecurityContext<P extends object>(
  Component: React.ComponentType<P & { securityContext: any }>,
  getSecurityContext: () => any
) {
  return function SecuredComponent(props: P) {
    const securityContext = getSecurityContext();
    return <Component {...props} securityContext={securityContext} />;
  };
}
