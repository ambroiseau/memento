# 🔒 Guide de Migration Sécurisée

## 📋 Étape par Étape pour Sécuriser l'Application

### **Phase 1 : Configuration des Variables d'Environnement (OBLIGATOIRE)**

#### **1.1 Configuration Vercel**

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `memento`
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter les variables suivantes :

```
VITE_SUPABASE_URL = https://zcyalwewcdgbftaaneet.supabase.co
VITE_SUPABASE_ANON_KEY = [VOTRE_CLÉ_ANON_SUPABASE]
VITE_PDF_RENDERER_URL = https://memento-production-5f3d.up.railway.app
```

#### **1.2 Vérification**

- ✅ Tester que l'app fonctionne avec les variables d'environnement
- ✅ Vérifier dans la console que le message "✅ SECURITY: Using environment variables" apparaît

### **Phase 2 : Migration de la Configuration (APRÈS PHASE 1)**

#### **2.1 Remplacer vercel.json**

```bash
# Remplacer l'ancien vercel.json par la version sécurisée
mv vercel-secure.json vercel.json
```

#### **2.2 Supprimer les Fallbacks (APRÈS VÉRIFICATION)**

1. Modifier `src/utils/supabase/client.tsx`
2. Supprimer les lignes de fallback hardcodées
3. Garder seulement la validation stricte

### **Phase 3 : Test et Validation**

#### **3.1 Test Local**

```bash
npm run build
npm run preview
```

#### **3.2 Test Production**

1. Déployer sur Vercel
2. Vérifier que l'app fonctionne
3. Vérifier les headers de sécurité dans les DevTools

## 🚨 Points d'Attention

### **⚠️ NE PAS FAIRE AVANT :**

- Supprimer `vercel.json` sans configurer les variables
- Supprimer les fallbacks sans tester
- Déployer sans validation

### **✅ FAIRE EN PREMIER :**

- Configurer les variables sur Vercel
- Tester en local
- Valider chaque étape

## 🔍 Vérification de Sécurité

### **Headers de Sécurité Attendus :**

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### **Console Messages :**

- ✅ "✅ SECURITY: Using environment variables for Supabase configuration"
- ❌ "⚠️ SECURITY WARNING: Using hardcoded Supabase keys in development" (en dev seulement)

## 🆘 En Cas de Problème

### **Rollback Rapide :**

```bash
git checkout main
git checkout -b feature/security-rollback
# Restaurer l'ancienne configuration
```

### **Debug :**

1. Vérifier les variables d'environnement sur Vercel
2. Vérifier les logs de build
3. Tester en local avec `.env`
