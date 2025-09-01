# 🚀 Système de Double Stockage d'Images - Guide d'Implémentation

## 📋 Vue d'Ensemble

Ce système implémente un stockage sécurisé et performant des images avec :
- **Images originales** : Stockées dans un bucket privé (qualité maximale, 50MB max)
- **Images display** : Stockées dans un bucket public (compressées, 10MB max, rapides)
- **Sécurité maximale** : Politiques RLS, URLs signées, validation stricte
- **Performance optimale** : Lazy loading, cache intelligent, compression automatique

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase       │    │   Base de       │
│   (React)       │    │   Storage        │    │   Données       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ OptimizedImage  │    │ post-images-     │    │ post_images     │
│ Component       │    │ original (privé) │    │ table avec      │
│                 │    │ post-images-     │    │ double URLs     │
│                 │    │ display (public) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📊 Configuration des Tailles

### **Bucket 1 : `post-images-original` (PRIVÉ)**
- **Taille maximale** : 50MB
- **Usage** : Images haute qualité, photos RAW, photos originales
- **Accès** : Membres de la famille uniquement
- **Stockage** : Long terme, qualité maximale

### **Bucket 2 : `post-images-display` (PUBLIC)**
- **Taille maximale** : 10MB
- **Usage** : Images compressées pour l'affichage web
- **Accès** : Public (pour les performances)
- **Stockage** : Optimisé pour le web, compression 80%

## 🔒 Fonctionnalités de Sécurité

### **1. Validation des Fichiers**
- ✅ Types MIME autorisés uniquement
- ✅ Taille maximale contrôlée (50MB original, 10MB display)
- ✅ Dimensions maximales limitées
- ✅ Noms de fichiers sécurisés

### **2. Politiques RLS**
- ✅ Accès familial uniquement
- ✅ Propriétaire des images uniquement
- ✅ Séparation privé/public stricte

### **3. URLs Signées**
- ✅ Expiration automatique
- ✅ Cache sécurisé
- ✅ Validation du contexte

### **4. Logs Sécurisés**
- ✅ Pas d'exposition de données sensibles
- ✅ Messages d'erreur génériques
- ✅ Warnings non bloquants

## ⚡ Fonctionnalités de Performance

### **1. Double Upload**
- ✅ Upload parallèle des deux versions
- ✅ Compression automatique côté client
- ✅ Gestion des erreurs avec rollback

### **2. Chargement Intelligent**
- ✅ Image display chargée en premier (rapide)
- ✅ Image originale en arrière-plan (qualité)
- ✅ Lazy loading avec Intersection Observer

### **3. Cache Optimisé**
- ✅ Cache des URLs signées
- ✅ Nettoyage automatique des expirations
- ✅ Invalidation forcée disponible

## 🚀 Guide d'Implémentation

### **Étape 1 : Configuration de l'Infrastructure**

#### **1.1 Création des Buckets**
```bash
# Rendre le script exécutable
chmod +x scripts/setup-double-storage.sh

# Exécuter la configuration automatique
./scripts/setup-double-storage.sh
```

#### **1.2 Application des Politiques RLS**
```sql
-- Exécuter le script SQL
\i scripts/setup-secure-storage.sql
```

#### **1.3 Migration de la Base de Données**
```sql
-- Exécuter la migration
\i scripts/migrate-double-storage.sql
```

### **Étape 2 : Intégration des Services**

#### **2.1 Service d'Upload Sécurisé**
```typescript
// Dans CreatePost.tsx
import { secureImageUpload } from '../utils/secure-image-upload';

const uploadImages = async () => {
  const uploadedImages = [];

  for (let i = 0; i < selectedImages.length; i++) {
    const image = selectedImages[i];
    try {
      const result = await secureImageUpload.uploadWithCompression(
        image.file,
        user.id,
        family.id
      );

      uploadedImages.push(result);

      // Mettre à jour l'état local
      selectedImages[i] = {
        ...selectedImages[i],
        uploadedUrl: result.displayUrl, // URL display pour l'affichage
        originalUrl: result.originalUrl, // URL original pour les PDFs
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  return uploadedImages;
};
```

#### **2.2 Service d'URLs Signées**
```typescript
// Dans FeedScreen.tsx
import { secureSignedUrls } from '../utils/secure-signed-urls';

const loadPosts = useCallback(async () => {
  try {
    // ... récupération des posts ...

    // Générer les URLs signées sécurisées
    const postsWithUrls = await secureSignedUrls.getFamilyPostsUrls(posts, {
      userId: user.id,
      familyId: family.id,
      operation: 'read',
    });

    setPosts(postsWithUrls);
  } catch (error) {
    console.error('Error loading posts:', error);
    setError('Failed to load posts');
  }
}, [user.id, family.id]);
```

### **Étape 3 : Composant Image Optimisé**

#### **3.1 Utilisation du Composant**
```typescript
// Dans FeedScreen.tsx
import { OptimizedImage } from './OptimizedImage';

// Remplacer les anciens composants Image
<OptimizedImage
  originalUrl={image.originalUrl}
  displayUrl={image.displayUrl}
  alt={image.altText || 'Post image'}
  width={400}
  height={300}
  className="rounded-lg"
  securityContext={{
    userId: user.id,
    familyId: family.id
  }}
/>
```

#### **3.2 HOC pour le Contexte de Sécurité**
```typescript
// Dans FeedScreen.tsx
import { withSecurityContext } from './OptimizedImage';

const SecuredOptimizedImage = withSecurityContext(
  OptimizedImage,
  () => ({ userId: user.id, familyId: family.id })
);

// Utilisation
<SecuredOptimizedImage
  originalUrl={image.originalUrl}
  displayUrl={image.displayUrl}
  alt={image.altText || 'Post image'}
  width={400}
  height={300}
  className="rounded-lg"
/>
```

## 🔧 Configuration des Variables d'Environnement

### **.env**
```bash
# Storage Configuration
VITE_STORAGE_BUCKET_ORIGINAL=post-images-original
VITE_STORAGE_BUCKET_DISPLAY=post-images-display

# Security Configuration
VITE_MAX_FILE_SIZE=52428800
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/webp
VITE_COMPRESSION_QUALITY=0.8
VITE_COMPRESSION_MAX_WIDTH=1200
VITE_COMPRESSION_MAX_HEIGHT=1200
```

## 📊 Monitoring et Performance

### **1. Métriques de Compression**
```typescript
// Dans le composant OptimizedImage
const compressionStats = {
  originalSize: image.metadata?.fileSizeOriginal,
  displaySize: image.metadata?.fileSizeDisplay,
  compressionRatio: image.metadata?.compressionRatio,
  loadTime: Date.now() - startTime,
};
```

### **2. Cache Performance**
```typescript
// Dans secure-signed-urls.ts
const cacheStats = {
  totalUrls: urlCache.size,
  expiredUrls: expiredCount,
  hitRate: cacheHits / (cacheHits + cacheMisses),
};
```

### **3. Logs de Performance**
```typescript
// Logs sécurisés des performances
console.log('Image load performance:', {
  imageId: image.id,
  loadTime: loadTime,
  quality: imageState.isHighQuality ? 'HD' : 'Optimized',
  cacheHit: isFromCache,
});
```

## 🧪 Tests et Validation

### **1. Test de Sécurité**
```bash
# Test des politiques RLS
npm run test:security

# Test des validations de fichiers
npm run test:file-validation

# Test des URLs signées
npm run test:signed-urls
```

### **2. Test de Performance**
```bash
# Test de compression
npm run test:compression

# Test de cache
npm run test:cache

# Test de lazy loading
npm run test:lazy-loading
```

### **3. Test d'Intégration**
```bash
# Test complet du système
npm run test:integration

# Test des scénarios d'erreur
npm run test:error-scenarios
```

## 🚨 Gestion des Erreurs

### **1. Erreurs d'Upload**
```typescript
try {
  const result = await secureImageUpload.uploadWithCompression(
    file,
    userId,
    familyId
  );
} catch (error) {
  if (error.message.includes('Validation échouée')) {
    // Erreur de validation - afficher à l'utilisateur
    setError('Fichier non autorisé. Vérifiez le type et la taille.');
  } else if (error.message.includes('Upload exception')) {
    // Erreur technique - log sécurisé
    console.error('Upload technical error');
    setError('Erreur technique. Réessayez plus tard.');
  } else {
    // Erreur générique
    setError("Échec de l'upload. Réessayez.");
  }
}
```

### **2. Erreurs de Chargement**
```typescript
// Dans OptimizedImage
const handleImageError = useCallback(() => {
  setImageState(prev => ({
    ...prev,
    hasError: true,
    errorMessage: "Erreur de chargement de l'image",
    isLoading: false,
  }));

  // Log sécurisé
  console.warn('Image load failed:', {
    displayUrl: displayUrl?.substring(0, 20) + '...',
    error: 'Load failed',
  });

  onError?.("Erreur de chargement de l'image");
}, [displayUrl, onError]);
```

## 🔄 Migration des Données Existantes

### **1. Script de Migration**
```sql
-- Migration des anciennes images
UPDATE post_images
SET
  display_url = storage_path,
  compression_ratio = 1.0,
  file_size_display = 0
WHERE display_url IS NULL;
```

### **2. Regénération des Images Display**
```typescript
// Script de migration des images existantes
const migrateExistingImages = async () => {
  const { data: existingImages } = await supabase
    .from('post_images')
    .select('*')
    .is('display_url', null);

  for (const image of existingImages || []) {
    try {
      // Télécharger l'image originale
      const { data: imageData } = await supabase.storage
        .from('post-images')
        .download(image.storage_path);

      if (imageData) {
        // Compresser et uploader
        const compressedFile = await compressImage(imageData);
        const displayPath = `post-images-display/${image.family_id}/${image.user_id}/${image.id}.jpg`;

        await supabase.storage
          .from('post-images-display')
          .upload(displayPath, compressedFile);

        // Mettre à jour la DB
        await supabase
          .from('post_images')
          .update({
            display_url: displayPath,
            compression_ratio: compressedFile.size / imageData.size,
          })
          .eq('id', image.id);
      }
    } catch (error) {
      console.error('Migration failed for image:', image.id);
    }
  }
};
```

## 📈 Optimisations Futures

### **1. WebP Support**
```typescript
// Ajout du support WebP pour une meilleure compression
const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Conversion automatique en WebP si supporté
if (supportsWebP()) {
  const webpBlob = await convertToWebP(file);
  // Upload WebP version
}
```

### **2. CDN Integration**
```typescript
// Intégration avec un CDN pour les images publiques
const getCDNUrl = (path: string, width?: number, height?: number) => {
  const cdnBase = process.env.VITE_CDN_URL;
  const params = width && height ? `?w=${width}&h=${height}` : '';
  return `${cdnBase}/${path}${params}`;
};
```

### **3. Progressive JPEG**
```typescript
// Support des JPEG progressifs pour un chargement plus fluide
const createProgressiveJPEG = async (file: File) => {
  // Implémentation de la compression progressive
};
```

## 🎯 Résumé des Avantages

### **Sécurité**
- ✅ Images originales protégées (50MB max)
- ✅ Validation stricte des fichiers
- ✅ Politiques RLS robustes
- ✅ URLs signées temporaires

### **Performance**
- ✅ Chargement rapide des images compressées (10MB max)
- ✅ Lazy loading intelligent
- ✅ Cache optimisé des URLs
- ✅ Compression automatique (80% de réduction)

### **Maintenance**
- ✅ Architecture modulaire
- ✅ Gestion d'erreurs robuste
- ✅ Logs sécurisés
- ✅ Migration automatique

---

**🚀 Le système est maintenant prêt à être déployé !**

Suivez les étapes d'implémentation dans l'ordre et testez chaque composant avant de passer au suivant.
