# Migration Guide: Base64 to Signed URLs

## 🎯 Objectif

Migrer les images stockées en base64 dans la base de données vers Supabase Storage avec des URLs signées.

## 📊 État actuel

- **5 images base64** à migrer (~3MB+ de données)
- **2 images** déjà avec des chemins de stockage
- **Bucket `post-images`** configuré dans Supabase Storage

## 🚀 Étapes de migration

### 1. Migration de la base de données

**Exécutez dans Supabase Dashboard → SQL Editor :**

```sql
-- Contenu du fichier: sql/migrate-post-images-table.sql
```

Cette migration ajoute :

- `file_size` : Taille du fichier en bytes
- `mime_type` : Type MIME de l'image
- `width/height` : Dimensions de l'image
- `migrated_at` : Timestamp de migration
- `original_filename` : Nom original du fichier

### 2. Migration des images

```bash
# Vérifier l'état actuel
node scripts/check-current-status.js

# Migrer les images base64 vers Storage
node scripts/migrate-images-to-storage.js

# Vérifier le statut après migration
node scripts/check-migration-status.js
```

### 3. Test des URLs signées

```bash
# Tester la génération d'URLs signées
node scripts/generate-signed-urls.js
```

## 🔧 Mise à jour de l'application

### Frontend

1. **Utiliser le helper pour les URLs signées :**

```javascript
import { getSignedImageUrl, getPostImageUrls } from '../utils/signedUrls';

// Pour une image unique
const imageUrl = await getSignedImageUrl(image.storage_path);

// Pour tous les images d'un post
const postWithUrls = await getPostImageUrls(post);
```

2. **Mise à jour des composants :**

```javascript
// Avant (base64)
<img src={image.storage_path} alt={image.alt_text} />;

// Après (URLs signées)
const [imageUrl, setImageUrl] = useState(null);

useEffect(() => {
  getSignedImageUrl(image.storage_path).then(setImageUrl);
}, [image.storage_path]);

<img src={imageUrl} alt={image.alt_text} />;
```

### Backend (PDF Renderer)

Le service PDF est déjà configuré pour gérer les deux formats :

- ✅ Images base64 (legacy)
- ✅ URLs signées (nouveau)

## 📁 Structure de stockage

```
post-images/
└── images/
    ├── {uuid}.jpg
    ├── {uuid}.png
    └── {uuid}.gif
```

## 🔗 Format des URLs signées

```
https://zcyalwewcdgbftaaneet.supabase.co/storage/v1/object/sign/post-images/images/{filename}?token={signed_token}&expires={timestamp}
```

**Durée de vie :** 10 minutes par défaut

## 📈 Avantages

### Performance

- ✅ **Base de données plus légère** (~3MB+ économisés)
- ✅ **Chargement plus rapide** des pages
- ✅ **Meilleure scalabilité**

### Fonctionnalités

- ✅ **CDN automatique** via Supabase
- ✅ **Métadonnées complètes** (taille, type, dimensions)
- ✅ **URLs sécurisées** avec expiration
- ✅ **Compatibilité legacy** (base64 encore supporté)

### Maintenance

- ✅ **Gestion centralisée** des images
- ✅ **Backup automatique** via Supabase
- ✅ **Monitoring** des métadonnées

## 🧪 Tests

### 1. Test de migration

```bash
node scripts/check-migration-status.js
```

### 2. Test des URLs signées

```bash
node scripts/generate-signed-urls.js
```

### 3. Test de l'application

- ✅ Affichage des images dans l'app
- ✅ Génération de PDFs avec images
- ✅ Performance de chargement

## 🔄 Rollback

En cas de problème, les images base64 originales sont conservées dans la base de données. Pour revenir en arrière :

1. **Arrêter l'utilisation des URLs signées**
2. **Utiliser les données base64** (encore présentes)
3. **Nettoyer les fichiers Storage** si nécessaire

## 📋 Checklist

- [ ] Exécuter la migration SQL
- [ ] Migrer les images base64
- [ ] Tester les URLs signées
- [ ] Mettre à jour le frontend
- [ ] Tester l'application complète
- [ ] Vérifier les performances
- [ ] Documenter les changements

## 🎉 Résultat final

Après la migration :

- **Base de données** : Plus légère et performante
- **Images** : Stockées dans Supabase Storage
- **URLs** : Générées dynamiquement avec expiration
- **Performance** : Améliorée grâce au CDN
- **Scalabilité** : Prête pour la croissance

---

**Note :** Cette migration est **réversible** et **sûre**. Les données originales sont conservées pendant la transition.
