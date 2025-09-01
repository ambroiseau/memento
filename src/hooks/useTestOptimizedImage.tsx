import { useCallback, useState } from 'react';

// 🔒 Hook de Test pour OptimizedImage
// Ce hook permet de tester le composant dans l'application existante

export interface TestImageData {
  originalUrl: string;
  displayUrl: string;
  alt: string;
  width: number;
  height: number;
}

export function useTestOptimizedImage() {
  const [testMode, setTestMode] = useState<'demo' | 'error' | 'loading'>(
    'demo'
  );
  const [isTestVisible, setIsTestVisible] = useState(false);

  // Données de test
  const testImages: Record<string, TestImageData> = {
    demo: {
      originalUrl: 'https://picsum.photos/800/600',
      displayUrl: 'https://picsum.photos/400/300',
      alt: 'Image de démonstration',
      width: 400,
      height: 300,
    },
    error: {
      originalUrl: '',
      displayUrl: '',
      alt: 'Image avec erreur',
      width: 400,
      height: 300,
    },
    loading: {
      originalUrl: 'https://httpstat.us/200?sleep=3000',
      displayUrl: 'https://httpstat.us/200?sleep=1000',
      alt: 'Image en chargement',
      width: 400,
      height: 300,
    },
  };

  const currentImage = testImages[testMode];

  const toggleTest = useCallback(() => {
    setIsTestVisible(prev => !prev);
  }, []);

  const changeTestMode = useCallback((mode: 'demo' | 'error' | 'loading') => {
    setTestMode(mode);
  }, []);

  const getTestComponent = useCallback(() => {
    if (!isTestVisible) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                🧪 Test du Composant OptimizedImage
              </h1>
              <button
                onClick={toggleTest}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Contrôles de test */}
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">
                🎮 Contrôles de Test
              </h2>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => changeTestMode('demo')}
                  className={`px-3 py-2 rounded text-sm ${
                    testMode === 'demo'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  🎯 Mode Démo
                </button>
                <button
                  onClick={() => changeTestMode('error')}
                  className={`px-3 py-2 rounded text-sm ${
                    testMode === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  ❌ Mode Erreur
                </button>
                <button
                  onClick={() => changeTestMode('loading')}
                  className={`px-3 py-2 rounded text-sm ${
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
                  <p>
                    ✅ Test avec des images valides - démonstration du
                    fonctionnement normal
                  </p>
                )}
                {testMode === 'error' && (
                  <p>
                    ❌ Test avec des URLs invalides - vérification de la gestion
                    d'erreur
                  </p>
                )}
                {testMode === 'loading' && (
                  <p>
                    ⏳ Test avec des images lentes - vérification du lazy
                    loading et des états
                  </p>
                )}
              </div>
            </div>

            {/* Test du composant OptimizedImage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image de test */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  🖼️ Composant OptimizedImage
                </h3>
                <div className="border border-gray-300 rounded-lg p-4">
                  {/* Ici nous importerons le composant OptimizedImage */}
                  <div className="bg-gray-200 rounded-lg p-8 text-center text-gray-600">
                    <p>Composant OptimizedImage à importer</p>
                    <p className="text-sm mt-2">
                      Mode: {testMode} | URLs:{' '}
                      {currentImage.originalUrl ? '✅' : '❌'} /{' '}
                      {currentImage.displayUrl ? '✅' : '❌'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations de debug */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  🔍 Informations de Debug
                </h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <div className="mb-2">
                    <span className="text-yellow-400">Mode:</span> {testMode}
                  </div>
                  <div className="mb-2">
                    <span className="text-yellow-400">Original URL:</span>{' '}
                    {currentImage.originalUrl || 'undefined'}
                  </div>
                  <div className="mb-2">
                    <span className="text-yellow-400">Display URL:</span>{' '}
                    {currentImage.displayUrl || 'undefined'}
                  </div>
                  <div className="mb-2">
                    <span className="text-yellow-400">Alt:</span>{' '}
                    {currentImage.alt}
                  </div>
                  <div className="mb-2">
                    <span className="text-yellow-400">Dimensions:</span>{' '}
                    {currentImage.width}x{currentImage.height}
                  </div>
                  <div className="text-xs text-gray-500 mt-4">
                    Ouvrez la console pour voir les logs détaillés
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">
                📋 Instructions de Test
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • <strong>Mode Démo</strong> : Teste le fonctionnement normal
                  avec des images valides
                </li>
                <li>
                  • <strong>Mode Erreur</strong> : Teste la gestion des erreurs
                  et l'affichage des fallbacks
                </li>
                <li>
                  • <strong>Mode Chargement</strong> : Teste les états de
                  chargement et le lazy loading
                </li>
                <li>
                  • Ouvrez la console du navigateur pour voir les logs détaillés
                </li>
                <li>• Testez sur mobile pour vérifier la responsivité</li>
              </ul>
            </div>

            {/* Statut des buckets */}
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">
                ⚠️ Configuration Requise
              </h3>
              <p className="text-sm text-red-700 mb-2">
                Pour tester le système complet, vous devez d'abord créer les
                buckets Supabase :
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>
                  • <code>post-images-original</code> (bucket privé)
                </li>
                <li>
                  • <code>post-images-display</code> (bucket public)
                </li>
                <li>
                  • <code>generated-pdfs</code> (bucket public)
                </li>
              </ul>
              <p className="text-sm text-red-700 mt-2">
                Créez-les via l'interface Supabase {'>'} Storage {'>'} Buckets
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isTestVisible, testMode, currentImage, toggleTest, changeTestMode]);

  return {
    isTestVisible,
    toggleTest,
    changeTestMode,
    currentImage,
    getTestComponent,
  };
}
