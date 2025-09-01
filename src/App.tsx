import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { CreatePost } from './components/CreatePost';
import { FeedScreen } from './components/FeedScreen';
import { ImageGallery } from './components/ImageGallery';
import { LoadingScreen } from './components/LoadingScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useAppActions } from './hooks/useAppActions';
import { useAppState } from './hooks/useAppState';
import { initializePWA } from './utils/pwa';
import { supabase } from './utils/supabase/client';

export default function App() {
  const state = useAppState();
  const actions = useAppActions(state);

  const { isLoading, setIsLoading, setUser, setAccessToken, setCurrentScreen } =
    state;
  const { loadUserData } = actions;

  useEffect(() => {
    // Initialize PWA features
    initializePWA().catch(console.error);

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
