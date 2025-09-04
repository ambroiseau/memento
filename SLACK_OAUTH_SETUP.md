# Configuration OAuth Slack pour Memento

## 🚀 Déploiement de la route OAuth

La route OAuth Slack a été créée dans `/api/slack-oauth.js` et sera automatiquement déployée sur Vercel.

## 🔧 Configuration des variables d'environnement

### 1. Variables Vercel

Ajoutez ces variables dans votre projet Vercel :

```bash
SLACK_CLIENT_ID=xoxb-your-client-id
SLACK_CLIENT_SECRET=your-client-secret
```

### 2. Configuration Slack App

Sur [api.slack.com](https://api.slack.com/apps) :

1. **OAuth & Permissions**
   - **Redirect URLs** : `https://memento-ruddy.vercel.app/api/slack-oauth`
   - **Scopes Bot Token** :
     - `files:read`
     - `channels:read`
     - `users:read`
     - `chat:write`

2. **Install App**
   - Cliquez sur "Install to Workspace"
   - Copiez le **Bot User OAuth Token** (commence par `xoxb-`)

3. **Event Subscriptions**
   - **Request URL** : `https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook`
   - **Subscribe to bot events** :
     - `file_shared`
     - `member_joined_channel`
     - `app_mention`

## 🔗 URL d'autorisation

Pour lancer le processus OAuth, redirigez l'utilisateur vers :

```
https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&scope=files:read,channels:read,users:read,chat:write&redirect_uri=https://memento-ruddy.vercel.app/api/slack-oauth
```

## 📋 Flux OAuth

1. **Utilisateur clique sur le lien d'autorisation**
2. **Slack redirige vers** : `/api/slack-oauth?code=AUTH_CODE`
3. **Route OAuth échange le code** contre un `access_token`
4. **Redirection vers** : `/success` (page de confirmation)
5. **Utilisateur peut configurer** les channels dans l'app

## 🧪 Test

1. Déployez sur Vercel
2. Configurez les variables d'environnement
3. Testez l'URL d'autorisation
4. Vérifiez la redirection vers `/success`

## 🔍 Dépannage

- **Erreur 400** : Code OAuth manquant
- **Erreur 500** : Problème avec les credentials Slack
- **Redirection échoue** : Vérifiez l'URL de redirection dans Slack
