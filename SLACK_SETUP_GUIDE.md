# 🚀 Guide de Configuration Slack - Memento App

## ✅ **Étapes de Configuration**

### **1. Configuration de l'App Slack (Déjà fait ✅)**

Vous avez déjà créé l'app Slack sur [api.slack.com](https://api.slack.com).

### **2. Configuration du Webhook Slack**

1. **Allez dans votre app Slack** sur api.slack.com
2. **Cliquez sur "Event Subscriptions"** dans le menu de gauche
3. **Activez les événements** en cliquant sur le toggle
4. **URL du webhook** : `https://zcyalwewcdgbftaaneet.functions.supabase.co/slack-webhook`
5. **Événements à écouter** :
   - `file_shared` (quand un fichier est partagé)
   - `member_joined_channel` (quand le bot rejoint un channel)
   - `app_mention` (quand le bot est mentionné)
   - `message.channels` (optionnel, pour les messages avec fichiers)

### **3. Configuration du Token Bot**

1. **Récupérez votre Bot User OAuth Token** (commence par `xoxb-`)
2. **Configurez le secret dans Supabase** :
   ```bash
   supabase secrets set SLACK_BOT_TOKEN=xoxb-votre-token-ici
   ```

### **4. Configuration dans l'App Memento**

#### **Option A : Liaison Automatique (Recommandée) 🚀**

1. **Ouvrez votre app Memento** (http://localhost:3000)
2. **Allez dans Paramètres** (Settings)
3. **Cliquez sur l'icône Slack**
4. **Cliquez sur "🔗 Auto Link"**
5. **Copiez le code généré** (ex: `ABC123`)
6. **Invitez le bot Memento** dans votre channel Slack
7. **Mentionnez le bot** avec : `@MementoBot ABC123`
8. **Le channel est automatiquement lié !** ✅

#### **Option B : Configuration Manuelle**

1. **Ouvrez votre app Memento** (http://localhost:3000)
2. **Allez dans Paramètres** (Settings)
3. **Cliquez sur l'icône Slack**
4. **Entrez le Channel ID** de votre channel Slack
5. **Cliquez sur "Test Connection"**

### **5. Comment récupérer le Channel ID ? (Option B uniquement)**

**Via l'interface Slack**

1. Ouvrez votre channel Slack
2. Cliquez sur le nom du channel en haut
3. Cliquez sur "À propos" ou "About"
4. Le Channel ID est affiché (commence par `C`)

**Via l'URL Slack**

- L'URL de votre channel contient le Channel ID
- Exemple : `https://workspace.slack.com/channels/C1234567890`
- Le Channel ID est : `C1234567890`

## 🧪 **Test de l'Intégration**

### **Test 1 : URL Verification**

```bash
curl -X POST https://zcyalwewcdgbftaaneet.functions.supabase.co/slack-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url_verification",
    "challenge": "test_challenge_123"
  }'
```

**Résultat attendu** : `test_challenge_123`

### **Test 2 : Partage de fichier**

1. **Partagez une image** dans votre channel Slack
2. **Vérifiez les logs** de l'Edge Function
3. **Vérifiez que l'image apparaît** dans votre app Memento

## 🔧 **Architecture**

```
Channel Slack "family-photos" → Channel ID: C1234567890
↓
Configuration dans Memento: Channel ID = C1234567890
↓
Quelqu'un poste une photo dans "family-photos"
↓
Slack envoie l'événement file_shared avec channel: C1234567890
↓
Edge Function trouve la famille correspondante
↓
Photo ajoutée à l'album de cette famille
```

## 📋 **Checklist de Configuration**

- [ ] App Slack créée sur api.slack.com
- [ ] Webhook configuré avec l'URL correcte
- [ ] Événements `file_shared` activés
- [ ] Bot User OAuth Token récupéré
- [ ] Secret `SLACK_BOT_TOKEN` configuré dans Supabase
- [ ] Channel ID récupéré et configuré dans l'app
- [ ] Test de connexion réussi
- [ ] Test avec un fichier partagé

## 🚨 **Dépannage**

### **Problème : "No family found for channel ID"**

- Vérifiez que le Channel ID est correct
- Vérifiez que la source Slack est configurée dans l'app
- Vérifiez que `source_type = 'slack'` dans la DB

### **Problème : "Missing required environment variables"**

- Vérifiez que `SLACK_BOT_TOKEN` est configuré
- Redéployez l'Edge Function si nécessaire

### **Problème : Fichier non téléchargé**

- Vérifiez les permissions du bot Slack
- Vérifiez que le bot a accès au channel
- Vérifiez les logs de l'Edge Function

## 🎯 **Prochaines Étapes**

1. **Configurez le webhook Slack** avec l'URL fournie
2. **Récupérez votre SLACK_BOT_TOKEN**
3. **Configurez le secret** dans Supabase
4. **Testez l'intégration** avec un fichier partagé

**L'Edge Function Slack est prête et déployée !** 🚀
