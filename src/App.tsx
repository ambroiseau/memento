import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthCallback } from './components/AuthCallback';
import { CreatePost } from './components/CreatePost';
import { FeedScreen } from './components/FeedScreen';
import { ImageGallery } from './components/ImageGallery';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { SettingsScreen } from './components/SettingsScreen';
import { SlackOAuthSuccess } from './components/SlackOAuthSuccess';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useAppActions } from './hooks/useAppActions';
import { useAppState } from './hooks/useAppState';
import { initializePWA } from './utils/pwa';
import { supabase } from './utils/supabase/client';

export default function App() {
  const state = useAppState();
  const actions = useAppActions(state);
  const [isAuthCallback, setIsAuthCallback] = useState(false);
  const [isSlackOAuthSuccess, setIsSlackOAuthSuccess] = useState(false);

  const { isLoading, setIsLoading, setUser, setAccessToken, setCurrentScreen } =
    state;
  const { loadUserData } = actions;

  useEffect(() => {
    // Initialize PWA features
    initializePWA().catch(console.error);

    // Check if we're on special routes
    const path = window.location.pathname;
    if (path === '/auth/callback') {
      setIsAuthCallback(true);
      return;
    }
    if (path === '/success') {
      setIsSlackOAuthSuccess(true);
      return;
    }

    const checkSession = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setAccessToken(session.access_token);
          await loadUserData(session.user.id, session.access_token);
        } else {
          setCurrentScreen('welcome');
        }
      } catch (error) {
        console.log('Error checking session:', error);
        setCurrentScreen('welcome');
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Show auth callback screen if we're on that route
  if (isAuthCallback) {
    return <AuthCallback />;
  }

  // Show Slack OAuth success screen if we're on that route
  if (isSlackOAuthSuccess) {
    return <SlackOAuthSuccess />;
  }

  if (isLoading) {
    return (
      <>
        <LoadingScreen />
        <Toaster position="top-center" />
      </>
    );
  }

  const appProps = { ...state, ...actions };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Main Feed Screen - Always rendered when user is authenticated */}
      {state.user && state.family && <FeedScreen {...appProps} />}

      {/* Overlay Screens - Rendered on top when active */}
      {state.currentScreen === 'welcome' && <WelcomeScreen {...appProps} />}

      {state.currentScreen === 'profile-setup' && (
        <ProfileSetup {...appProps} />
      )}

      {state.currentScreen === 'create-post' && <CreatePost {...appProps} />}

      {state.currentScreen === 'gallery' && <ImageGallery {...appProps} />}

      {state.currentScreen === 'settings' && <SettingsScreen {...appProps} />}
    </>
  );
}
