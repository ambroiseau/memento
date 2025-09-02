# 🚀 Guide de Déploiement - Edge Function Telegram Webhook

## 📋 Prérequis

### **1. Supabase CLI installé**
```bash
npm install -g supabase
```

### **2. Connexion à Supabase**
```bash
supabase login
```

### **3. Variables d'environnement configurées**
```bash
# Dans votre projet Supabase Dashboard
# Settings > API > Environment Variables

TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENVIRONMENT=production
```

## 🔧 Déploiement

### **1. Déployer l'Edge Function**
```bash
# Depuis le dossier racine du projet
supabase functions deploy telegram-webhook
```

### **2. Vérifier le déploiement**
```bash
supabase functions list
```

### **3. Obtenir l'URL de la fonction**
```bash
supabase functions list --project-ref your-project-ref
```

## 🌐 Configuration du Webhook Telegram

### **1. Configurer le webhook**
```bash
# Remplacer avec vos vraies valeurs
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project.supabase.co/functions/v1/telegram-webhook",
    "allowed_updates": ["message", "edited_message", "channel_post"],
    "drop_pending_updates": true
  }'
```

### **2. Vérifier la configuration**
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### **3. Tester le webhook**
```bash
# Envoyer un message avec média dans votre chat Telegram
# Vérifier les logs dans Supabase Dashboard > Functions > Logs
```

## 🧪 Tests et Validation

### **1. Test de la fonction**
```bash
# Test local (si configuré)
supabase functions serve telegram-webhook --env-file .env.local

# Test avec curl
curl -X POST "http://localhost:54321/functions/v1/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456789,
    "message": {
      "message_id": 1,
      "from": {"id": 123, "first_name": "Test"},
      "chat": {"id": -1001234567890, "type": "group", "title": "Test Group"},
      "date": 1640995200,
      "photo": [{
        "file_id": "test_file_id",
        "file_unique_id": "test_unique_id",
        "width": 800,
        "height": 600
      }]
    }
  }'
```

### **2. Vérification des logs**
```bash
# Voir les logs en temps réel
supabase functions logs telegram-webhook --follow

# Voir les logs d'une période spécifique
supabase functions logs telegram-webhook --start-time "2024-12-19T00:00:00Z"
```

## 🔒 Sécurité

### **1. Validation des webhooks (optionnel)**
```typescript
// Dans index.ts, ajouter la validation de signature
import { validateTelegramWebhook } from './security.ts';

// Avant de traiter la requête
if (!validateTelegramWebhook(req, botToken)) {
  return new Response(
    JSON.stringify({ error: 'Invalid webhook signature' }),
    { status: 401, headers: corsHeaders }
  );
}
```

### **2. Rate Limiting**
```typescript
// Implémenter un rate limiter basique
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
```

## 📊 Monitoring

### **1. Métriques à surveiller**
- **Taux de succès** des téléchargements
- **Temps de traitement** des médias
- **Utilisation du stockage**
- **Erreurs** et exceptions

### **2. Alertes recommandées**
- Échec de téléchargement > 5%
- Taille de stockage > 80%
- Temps de réponse > 10s

## 🚨 Dépannage

### **Problèmes courants**

#### **"Function not found"**
```bash
# Vérifier que la fonction est déployée
supabase functions list

# Redéployer si nécessaire
supabase functions deploy telegram-webhook
```

#### **"Environment variables missing"**
```bash
# Vérifier les variables dans le dashboard
# Settings > API > Environment Variables
```

#### **"Storage bucket not found"**
```bash
# Créer le bucket dans le dashboard
# Storage > New Bucket > "family-photos"
```

#### **"Permission denied"**
```bash
# Vérifier les policies RLS
# Vérifier la service role key
```

## 🔄 Mise à jour

### **1. Redéployer après modification**
```bash
supabase functions deploy telegram-webhook
```

### **2. Rollback en cas de problème**
```bash
# Revenir à la version précédente
supabase functions deploy telegram-webhook --version previous
```

## 📚 Ressources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Deno Runtime](https://deno.land/manual)

---

*Dernière mise à jour : 2024-12-19*
