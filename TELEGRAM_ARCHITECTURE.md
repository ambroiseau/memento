# Architecture Telegram - Version Sécurisée

## Vue d'ensemble

L'intégration Telegram a été refactorisée pour améliorer la sécurité et la simplicité de configuration.

## Architecture

### 1. Configuration Centralisée

- **Bot Token** : Stocké dans les variables d'environnement de la fonction Edge
- **Chat ID** : Configuré par famille dans l'interface utilisateur

### 2. Sécurité

- ✅ **Bot Token** : Jamais exposé dans l'interface utilisateur
- ✅ **Variables d'environnement** : Stockées de manière sécurisée dans Supabase
- ✅ **Accès restreint** : Seuls les admins de famille peuvent configurer les sources

### 3. Configuration par Famille

Chaque famille configure uniquement :

- **Nom de la source** (ex: "Family Telegram Bot")
- **Chat ID** (ex: -1001234567890)

### 4. Stockage en Base

```sql
-- Table external_data_sources
{
  "family_id": "uuid",
  "source_type": "telegram",
  "name": "Family Telegram Bot",
  "config": {
    "chat_id": "-1001234567890"
  },
  "is_active": true
}
```

## Avantages

1. **Sécurité** : Token centralisé et sécurisé
2. **Simplicité** : Une seule configuration par famille
3. **Maintenance** : Un seul endroit pour changer le bot
4. **Cohérence** : Même bot pour toutes les familles
5. **Évolutivité** : Facile d'ajouter de nouvelles familles

## Configuration

### Pour les Développeurs

1. Définir `TELEGRAM_BOT_TOKEN` dans les secrets de la fonction Edge
2. Définir `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`

### Pour les Utilisateurs

1. Aller dans Settings > External Data Sources
2. Cliquer sur "Telegram"
3. Entrer le nom de la source
4. Entrer le Chat ID du groupe
5. Tester et sauvegarder

## Fonctionnement

1. **Réception** : Webhook Telegram reçoit une photo
2. **Identification** : Trouve la famille basée sur le `chat_id`
3. **Traitement** : Télécharge et traite la photo
4. **Stockage** : Upload vers Supabase Storage
5. **Base de données** : Crée le post et l'image
6. **Affichage** : Photo visible dans l'app avec caption

## Migration

Les anciennes configurations avec `bot_token` dans la base seront automatiquement ignorées.
La fonction Edge utilise maintenant uniquement le token centralisé.
