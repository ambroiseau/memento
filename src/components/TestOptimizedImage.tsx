import React, { useState } from 'react';
import { OptimizedImage } from './OptimizedImage';

// 🔒 Composant de Test pour OptimizedImage
// Ce composant permet de tester le système sans les buckets Supabase

export function TestOptimizedImage() {
  const [testMode, setTestMode] = useState<'demo' | 'error' | 'loading'>('demo');

  // Données de test
  const testImages = {
    demo: {
      originalUrl: 'https://picsum.photos/800/600',
      displayUrl: 'https://picsum.photos/400/300',
      alt: 'Image de démonstration'
    },
    error: {
      originalUrl: '',
      displayUrl: '',
      alt: 'Image avec erreur'
    },
    loading: {
      originalUrl: 'https://httpstat.us/200?sleep=3000',
      displayUrl: 'https://httpstat.us/200?sleep=1000',
      alt: 'Image en chargement'
    }
  };

  const currentImage = testImages[testMode];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🧪 Test du Composant OptimizedImage
      </h1>

      {/* Contrôles de test */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🎮 Contrôles de Test</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setTestMode('demo')}
            className={`px-4 py-2 rounded ${
              testMode === 'demo'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            🎯 Mode Démo
          </button>
          <button
            onClick={() => setTestMode('error')}
            className={`px-4 py-2 rounded ${
              testMode === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            ❌ Mode Erreur
          </button>
          <button
            onClick={() => setTestMode('loading')}
            className={`px-4 py-2 rounded ${
              testMode === 'loading'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            ⏳ Mode Chargement
          </button>
        </div>
      </div>

      {/* Informations sur le mode actuel */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">
          Mode Actuel : {testMode.toUpperCase()}
        </h3>
        <div className="text-sm text-blue-700">
          {testMode === 'demo' && (
            <p>✅ Test avec des images valides - démonstration du fonctionnement normal</p>
          )}
          {testMode === 'error' && (
            <p>❌ Test avec des URLs invalides - vérification de la gestion d'erreur</p>
          )}
          {testMode === 'loading' && (
            <p>⏳ Test avec des images lentes - vérification du lazy loading et des états</p>
          )}
        </div>
      </div>

      {/* Test du composant OptimizedImage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image de test */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🖼️ Composant OptimizedImage</h3>
          <div className="border border-gray-300 rounded-lg p-4">
            <OptimizedImage
              originalUrl={currentImage.originalUrl}
              displayUrl={currentImage.displayUrl}
              alt={currentImage.alt}
              width={400}
              height={300}
              className="w-full h-auto rounded-lg"
              priority={testMode === 'demo'}
              securityContext={{
                userId: 'test-user-id',
                familyId: 'test-family-id'
              }}
              onLoad={() => console.log('✅ Image chargée avec succès')}
              onError={(error) => console.error('❌ Erreur de chargement:', error)}
            />
          </div>
        </div>

        {/* Informations de debug */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🔍 Informations de Debug</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="mb-2">
              <span className="text-yellow-400">Mode:</span> {testMode}
            </div>
            <div className="mb-2">
              <span className="text-yellow-400">Original URL:</span> {currentImage.originalUrl || 'undefined'}
            </div>
            <div className="mb-2">
              <span className="text-yellow-400">Display URL:</span> {currentImage.displayUrl || 'undefined'}
            </div>
            <div className="mb-2">
              <span className="text-yellow-400">Alt:</span> {currentImage.alt}
            </div>
            <div className="mb-2">
              <span className="text-yellow-400">Security Context:</span> ✅ Configuré
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Ouvrez la console pour voir les logs détaillés
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">📋 Instructions de Test</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Mode Démo</strong> : Teste le fonctionnement normal avec des images valides</li>
          <li>• <strong>Mode Erreur</strong> : Teste la gestion des erreurs et l'affichage des fallbacks</li>
          <li>• <strong>Mode Chargement</strong> : Teste les états de chargement et le lazy loading</li>
          <li>• Ouvrez la console du navigateur pour voir les logs détaillés</li>
          <li>• Testez sur mobile pour vérifier la responsivité</li>
        </ul>
      </div>

      {/* Statut des buckets */}
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">⚠️ Configuration Requise</h3>
        <p className="text-sm text-red-700 mb-2">
          Pour tester le système complet, vous devez d'abord créer les buckets Supabase :
        </p>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• <code>post-images-original</code> (bucket privé)</li>
          <li>• <code>post-images-display</code> (bucket public)</li>
          <li>• <code>generated-pdfs</code> (bucket public)</li>
        </ul>
        <p className="text-sm text-red-700 mt-2">
          Créez-les via l'interface Supabase > Storage > Buckets
        </p>
      </div>
    </div>
  );
}
