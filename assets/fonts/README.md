# Polices pour Memento

Ce dossier contient les polices utilisées dans l'application Memento.

## Caprasimo

- **Usage** : Police principale pour le logo et les titres dans les PDFs
- **Format** : TTF ou OTF
- **Source** : Google Fonts

## Installation

1. Téléchargez la police Caprasimo depuis Google Fonts
2. Placez le fichier `.ttf` ou `.otf` dans ce dossier
3. Nommez-le `Caprasimo-Regular.ttf` (ou `.otf`)
4. Configurez la variable d'environnement `MEMENTO_LOGO_FONT_PATH`

## Configuration

Dans votre fichier `.env` ou variables d'environnement de production :

```
MEMENTO_LOGO_FONT_PATH=./assets/fonts/Caprasimo-Regular.ttf
```

Pour Railway (production) :
```
MEMENTO_LOGO_FONT_PATH=/app/assets/fonts/Caprasimo-Regular.ttf
```
