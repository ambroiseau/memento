# 📱 Guide d'Intégration Telegram

## 🎯 Vue d'ensemble

L'intégration Telegram permet aux familles de récupérer automatiquement des médias (images, vidéos, documents) depuis des conversations Telegram et de les intégrer dans leur album familial Memento.

## 🚀 Configuration étape par étape

### 1. Créer un bot Telegram

1. **Ouvrir Telegram** et rechercher `@BotFather`
2. **Envoyer** `/newbot` à BotFather
3. **Choisir un nom** pour votre bot (ex: "Memento Family Bot")
4. **Choisir un username** unique se terminant par "bot" (ex: "memento_family_bot")
5. **Récupérer le token** fourni par BotFather (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Ajouter le bot à une conversation

#### Option A : Conversation existante
1. **Créer ou rejoindre** un groupe familial sur Telegram
2. **Ajouter le bot** au groupe en tapant son username
3. **Récupérer l'ID du chat** :
   - Envoyer un message dans le groupe
   - Visiter `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Noter l'`id` du chat (ex: `-1001234567890`)

#### Option B : Nouvelle conversation
1. **Démarrer une conversation** avec votre bot
2. **L'ID sera** votre ID utilisateur (ex: `123456789`)

### 3. Configurer dans Memento

1. **Aller dans les paramètres** de votre famille
2. **Section "Sources de données externes"**
3. **Cliquer sur "Nouvelle source"**
4. **Remplir le formulaire** :
   - **Nom** : "Conversation familiale"
   - **Token du bot** : Le token récupéré de BotFather
   - **ID du chat** : L'ID récupéré précédemment
   - **Description** (optionnel) : "Récupération automatique des médias familiaux"

### 4. Tester la connexion

1. **Cliquer sur "Tester"** pour vérifier la configuration
2. **Vérifier** que le bot peut accéder au chat
3. **Sauvegarder** la configuration

## 🔄 Fonctionnement

### Récupération automatique
- **Webhook** : Les nouveaux médias sont récupérés en temps réel
- **Synchronisation** : Vérification périodique des médias manqués
- **Filtrage** : Seuls les médias de type image/vidéo sont importés

### Types de médias supportés
- 📸 **Images** : Photos, stickers, GIFs
- 🎥 **Vidéos** : Vidéos, vidéos circulaires
- 📄 **Documents** : Fichiers PDF, images
- 🎵 **Audio** : Messages vocaux, fichiers audio

### Métadonnées conservées
- **Auteur** : Nom et username de l'expéditeur
- **Timestamp** : Date et heure du message
- **Légende** : Texte accompagnant le média
- **Informations du chat** : Titre, type de conversation

## ⚙️ Configuration avancée

### Paramètres de synchronisation
- **Fréquence** : Horodatage, quotidienne, hebdomadaire
- **Filtres** : Par type de média, par expéditeur
- **Limites** : Taille maximale des fichiers, nombre de médias

### Gestion des erreurs
- **Retry automatique** en cas d'échec
- **Notifications** d'erreur aux administrateurs
- **Logs détaillés** pour le débogage

## 🔒 Sécurité et confidentialité

### Isolation des données
- **Chaque famille** ne voit que ses propres sources
- **Permissions** : Seuls les admins peuvent configurer
- **Chiffrement** des tokens sensibles

### Validation des webhooks
- **Signature Telegram** pour authentifier les requêtes
- **Rate limiting** pour éviter le spam
- **Filtrage** par famille et source

## 🚧 Dépannage

### Problèmes courants

#### "Token invalide"
- Vérifier que le token est copié correctement
- S'assurer que le bot n'a pas été supprimé
- Vérifier les permissions du bot

#### "Impossible d'accéder au chat"
- Vérifier que le bot est bien ajouté au groupe
- S'assurer que le bot a les permissions de lecture
- Vérifier l'ID du chat

#### "Aucun média récupéré"
- Vérifier que la source est active
- S'assurer qu'il y a des médias dans le chat
- Vérifier les logs de synchronisation

### Logs et diagnostics
- **Console du navigateur** pour les erreurs frontend
- **Logs Supabase** pour les erreurs backend
- **Statut de synchronisation** dans l'interface

## 🔮 Fonctionnalités futures

### Sources supplémentaires
- **WhatsApp Business API** (quand disponible)
- **Email/IMAP** pour les newsletters familiales
- **Google Photos** pour la synchronisation
- **Dropbox/OneDrive** pour les dossiers partagés

### Améliorations
- **IA** pour le tri automatique des médias
- **Tags** et catégorisation intelligente
- **Synchronisation bidirectionnelle**
- **Notifications push** pour nouveaux médias

## 📞 Support

### Ressources utiles
- [Documentation Telegram Bot API](https://core.telegram.org/bots/api)
- [Guide BotFather](https://core.telegram.org/bots#how-do-i-create-a-bot)
- [Documentation Supabase](https://supabase.com/docs)

### Contact
- **Issues GitHub** pour les bugs
- **Discussions** pour les questions
- **Documentation** pour les guides détaillés

---

*Dernière mise à jour : 2024-12-19*
