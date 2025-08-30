# Troubleshooting Guide - PDF Renderer Service

## Erreurs courantes et solutions

### 1. Erreur "PDF service is not available"

**Symptômes :**
- Message d'erreur : "PDF service is not available. Please check if the service is running."
- Erreur JSON : "Unexpected end of JSON input"

**Solutions :**

1. **Vérifier que le service est démarré :**
   ```bash
   # Depuis la racine du projet
   npm run pdf:start
   
   # Ou manuellement
   cd renderer
   npm run dev
   ```

2. **Vérifier la configuration :**
   ```bash
   # Vérifier que le fichier .env existe
   ls renderer/.env
   
   # Vérifier les variables d'environnement
   cat renderer/.env
   ```

3. **Vérifier que le port 3001 est disponible :**
   ```bash
   # Vérifier si le port est utilisé
   lsof -i :3001
   
   # Tuer le processus si nécessaire
   kill -9 <PID>
   ```

### 2. Erreur "Family not found"

**Symptômes :**
- Erreur 404 lors de la génération
- Message : "Family not found"

**Solutions :**

1. **Vérifier que la famille existe dans la base de données**
2. **Vérifier les permissions RLS**
3. **Vérifier que l'utilisateur est membre de la famille**

### 3. Erreur "No posts found for the specified period"

**Symptômes :**
- Erreur 400 lors de la génération
- Message : "No posts found for the specified period"

**Solutions :**

1. **Vérifier qu'il y a des posts dans la période demandée**
2. **Vérifier la fonction RPC `get_family_posts_with_images`**
3. **Vérifier les dates de début et fin**

### 4. Erreur de compilation TypeScript

**Symptômes :**
- Erreurs lors de `npm run build`
- Erreurs de types TypeScript

**Solutions :**

1. **Réinstaller les dépendances :**
   ```bash
   cd renderer
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Vérifier la version de TypeScript :**
   ```bash
   npm list typescript
   ```

### 5. Erreur Puppeteer

**Symptômes :**
- Erreur lors de la génération PDF
- Erreur de lancement du navigateur

**Solutions :**

1. **Installer les dépendances système (Linux) :**
   ```bash
   sudo apt-get update
   sudo apt-get install -y \
     gconf-service \
     libasound2 \
     libatk1.0-0 \
     libc6 \
     libcairo2 \
     libcups2 \
     libdbus-1-3 \
     libexpat1 \
     libfontconfig1 \
     libgcc1 \
     libgconf-2-4 \
     libgdk-pixbuf2.0-0 \
     libglib2.0-0 \
     libgtk-3-0 \
     libnspr4 \
     libpango-1.0-0 \
     libpangocairo-1.0-0 \
     libstdc++6 \
     libx11-6 \
     libx11-xcb1 \
     libxcb1 \
     libxcomposite1 \
     libxcursor1 \
     libxdamage1 \
     libxext6 \
     libxfixes3 \
     libxi6 \
     libxrandr2 \
     libxrender1 \
     libxss1 \
     libxtst6 \
     ca-certificates \
     fonts-liberation \
     libappindicator1 \
     libnss3 \
     lsb-release \
     xdg-utils \
     wget
   ```

2. **Installer les dépendances système (macOS) :**
   ```bash
   brew install chromium
   ```

3. **Utiliser le mode sans sandbox (non recommandé pour la production) :**
   ```typescript
   const browser = await puppeteer.launch({
     headless: 'new',
     args: ['--no-sandbox', '--disable-setuid-sandbox'],
   });
   ```

### 6. Erreur de stockage Supabase

**Symptômes :**
- Erreur lors de l'upload du PDF
- Erreur de permissions de stockage

**Solutions :**

1. **Vérifier que le bucket `generated-pdfs` existe :**
   ```sql
   -- Créer le bucket si nécessaire
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('generated-pdfs', 'generated-pdfs', true)
   ON CONFLICT (id) DO NOTHING;
   ```

2. **Vérifier les politiques RLS du bucket :**
   ```sql
   -- Permettre l'upload pour le service role
   CREATE POLICY "Service role can upload PDFs" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'generated-pdfs' AND auth.role() = 'service_role');
   
   -- Permettre la lecture publique
   CREATE POLICY "Public can read PDFs" ON storage.objects
   FOR SELECT USING (bucket_id = 'generated-pdfs');
   ```

### 7. Erreur de base de données

**Symptômes :**
- Erreur lors de l'insertion dans `render_jobs`
- Erreur lors de l'appel de la fonction RPC

**Solutions :**

1. **Vérifier que la table `render_jobs` existe :**
   ```sql
   SELECT * FROM render_jobs LIMIT 1;
   ```

2. **Vérifier que la fonction RPC existe :**
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'get_family_posts_with_images';
   ```

3. **Exécuter la migration si nécessaire :**
   ```sql
   -- Exécuter le contenu de sql/create-render-jobs-table.sql
   ```

## Logs et débogage

### Activer les logs détaillés

```bash
# Démarrage avec logs détaillés
DEBUG=* npm run dev

# Ou avec des variables d'environnement
LOG_LEVEL=debug npm run dev
```

### Vérifier les logs du service

```bash
# Voir les logs en temps réel
tail -f renderer/logs/app.log

# Voir les erreurs
grep ERROR renderer/logs/app.log
```

### Test de l'API

```bash
# Test de santé
curl http://localhost:3001/health

# Test de génération (remplacer les UUIDs)
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{
    "family_id": "your-family-id",
    "start": "2024-01-01",
    "end": "2024-01-31",
    "requested_by": "your-user-id"
  }'
```

## Support

Si vous rencontrez des problèmes non couverts par ce guide :

1. Vérifiez les logs du service
2. Vérifiez la console du navigateur
3. Vérifiez les logs de Supabase
4. Créez un issue avec les détails de l'erreur
