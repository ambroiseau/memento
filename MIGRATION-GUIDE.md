# Migration Guide - PDF Renderer Setup

## Problème identifié

L'erreur `column "id" referenced in foreign key constraint does not exist` indique que la migration SQL originale ne correspond pas à la structure réelle de votre base de données.

## Structure réelle de la base de données

Après analyse, voici les différences trouvées :

| Table | Colonne attendue | Colonne réelle |
|-------|------------------|----------------|
| `profiles` | `id` | `user_id` |
| `posts` | `content` | `content_text` |
| `profiles` | `avatar` | `avatar_url` |
| `post_images` | `alt_text` | ❌ N'existe pas |

## Solution

### Étape 1 : Vérifier la structure actuelle

```bash
node scripts/check-db-structure.js
```

### Étape 2 : Exécuter la migration corrigée

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Cliquez sur "SQL Editor"

2. **Exécuter la migration corrigée**
   - Copiez le contenu de `sql/create-render-jobs-table-fixed.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run"

### Étape 3 : Vérifier la migration

```bash
node scripts/test-migration.js
```

## Fichiers de migration

### ❌ Ancien fichier (ne pas utiliser)
- `sql/create-render-jobs-table.sql`

### ✅ Nouveau fichier (utiliser celui-ci)
- `sql/create-render-jobs-table-fixed.sql`

## Corrections apportées

### 1. Contrainte de clé étrangère pour `profiles`
```sql
-- Avant (incorrect)
requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

-- Après (correct)
requested_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
```

### 2. Fonction RPC corrigée
```sql
-- Avant (incorrect)
p.content,
prof.id,
prof.avatar

-- Après (correct)
p.content_text as content,
prof.user_id,
prof.avatar_url
```

### 3. Gestion des colonnes manquantes
```sql
-- Ajout de valeurs par défaut pour les colonnes manquantes
'alt_text', ''  -- Pas de colonne alt_text dans post_images
```

## Test de la migration

Après avoir exécuté la migration, testez avec :

```bash
# Test complet
node scripts/test-migration.js

# Test du service de rendu
cd renderer
npm run dev
```

## Dépannage

### Si vous obtenez encore des erreurs :

1. **Vérifiez que la migration s'est bien exécutée :**
   ```sql
   SELECT * FROM render_jobs LIMIT 1;
   ```

2. **Vérifiez que la fonction RPC existe :**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'get_family_posts_with_images';
   ```

3. **Testez la fonction RPC :**
   ```sql
   SELECT * FROM get_family_posts_with_images(
     'your-family-id',
     '2024-01-01',
     '2024-12-31'
   );
   ```

### Erreurs courantes :

- **"relation does not exist"** : La migration n'a pas été exécutée
- **"column does not exist"** : Utilisez le fichier de migration corrigé
- **"permission denied"** : Vérifiez les politiques RLS

## Prochaines étapes

Une fois la migration réussie :

1. **Démarrer le service de rendu :**
   ```bash
   npm run pdf:start
   ```

2. **Configurer les variables d'environnement :**
   ```bash
   cd renderer
   cp env.example .env
   # Éditer avec vos clés Supabase
   ```

3. **Tester la fonctionnalité :**
   - Cliquer sur "Generate Album" dans l'app
   - Vérifier les albums dans Paramètres > Past Albums

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs du service de rendu
2. Consultez `renderer/TROUBLESHOOTING.md`
3. Vérifiez la console du navigateur pour les erreurs
4. Testez avec les scripts fournis
