import React from 'react';

export default function SlackOAuthSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connexion Slack réussie !
          </h1>
          <p className="text-gray-600 mb-6">
            Votre compte Slack a été connecté avec succès à Memento.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>

          <button
            onClick={() => (window.location.href = '/settings')}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Aller aux paramètres
          </button>
        </div>
      </div>
    </div>
  );
}
