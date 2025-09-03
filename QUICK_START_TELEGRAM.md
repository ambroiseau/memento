# 🚀 Guide de Démarrage Rapide - Intégration Telegram

## 📋 **Prérequis**

1. **Bot Telegram** créé via @BotFather
2. **Projet Supabase** configuré
3. **Token du bot** et **Chat ID** de votre groupe/famille

## ⚡ **Démarrage en 5 étapes**

### **1. Configuration de l'environnement**
```bash
# Copier le fichier d'exemple
cp env.local.example .env.local

# Éditer avec vos vraies valeurs
nano .env.local
```

**Variables à remplir :**
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service (Dashboard > Settings > API)
- `TELEGRAM_BOT_TOKEN` : Token de votre bot (@BotFather)

### **2. Test de la configuration**
```bash
# Tester que tout est configuré
node scripts/deploy-webhook-cloud.js
```

### **3. Déploiement de la fonction webhook**
1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **Edge Functions** → **New Function**
4. Nom : `telegram-webhook`
5. Copier le code depuis `supabase/functions/telegram-webhook/index.ts`
6. **Deploy**

### **4. Configuration du webhook Telegram**
```bash
# Remplacer <BOT_TOKEN> et <PROJECT_URL>
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://<PROJECT>.supabase.co/functions/v1/telegram-webhook"
```

### **5. Test en direct**
1. Envoyez une photo dans votre groupe Telegram
2. Vérifiez les logs dans Supabase Dashboard
3. Vérifiez que l'image apparaît dans votre app Memento

## 🔧 **Dépannage**

### **Erreur "Variables d'environnement manquantes"**
- Vérifiez que `.env.local` existe et contient les bonnes valeurs
- Redémarrez votre terminal après modification

### **Erreur "Function not found"**
- Vérifiez que la fonction est bien déployée sur Supabase
- Vérifiez l'URL du webhook dans la configuration Telegram

### **Images qui n'arrivent pas**
- Vérifiez les logs de la fonction dans Supabase Dashboard
- Vérifiez que le bot a accès au groupe
- Vérifiez les permissions de stockage Supabase

## 📱 **Test de l'interface utilisateur**

```bash
# Démarrer l'application
npm run dev

# Aller dans les paramètres → Sources de données externes
# Configurer une nouvelle source Telegram
```

## 🎯 **Prochaines étapes**

- ✅ **Webhook fonctionnel** : Images automatiques depuis Telegram
- 🔄 **Synchronisation périodique** : Récupération des anciens médias
- 📊 **Dashboard** : Statistiques d'utilisation
- 🔔 **Notifications** : Alertes de nouveaux médias

---

**Besoin d'aide ?** Vérifiez les logs dans Supabase Dashboard ou consultez `TELEGRAM_INTEGRATION_GUIDE.md`
