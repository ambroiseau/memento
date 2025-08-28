import { supabaseApi } from '../utils/supabase-api'
import { supabase } from '../utils/supabase/client'

export const useAppActions = (state) => {
  const {
    setUser,
    setFamily,
    setUserProfile,
    setAccessToken,
    setCurrentScreen,
    setPreviousScreen,
    currentScreen,
    setGalleryImages,
    setCurrentImageIndex
  } = state

  const loadUserData = async (userId: string, token: string) => {
    try {
      const profileData = await supabaseApi.getUserProfile(userId)
      
      if (profileData.user) {
        setUserProfile(profileData.user)
        
        const familyData = await supabaseApi.getUserFamily(userId)
        
        if (familyData.family) {
          setFamily(familyData.family)
          setCurrentScreen('feed')
        } else {
          setCurrentScreen('welcome')
        }
      } else {
        setCurrentScreen('profile-setup')
      }
    } catch (error) {
      console.log('Error loading user data:', error)
      setCurrentScreen('welcome')
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      setUser(data.user)
      setAccessToken(data.session.access_token)
      await loadUserData(data.user.id, data.session.access_token)
    } catch (error) {
      console.log('Sign in error:', error)
      throw error
    }
  }

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      const data = await supabaseApi.signUp(email, password, name)
      if (!data.success) throw new Error('Sign up failed')
      
      // Now sign in
      await handleSignIn(email, password)
    } catch (error) {
      console.log('Sign up error:', error)
      throw error
    }
  }

  const handleProfileSetup = async (name: string, avatar: string) => {
    try {
      const userData = {
        user_id: state.user.id,
        name,
        avatar_url: avatar
      }
      
      const data = await supabaseApi.createUserProfile(userData)
      setUserProfile(data.user)
      setCurrentScreen('welcome')
    } catch (error) {
      console.log('Profile setup error:', error)
      throw error
    }
  }

  const handleJoinFamily = async (familyCode: string) => {
    try {
      const data = await supabaseApi.joinFamily(familyCode, state.user.id)
      setFamily(data.family)
      setCurrentScreen('feed')
    } catch (error) {
      console.log('Join family error:', error)
      throw error
    }
  }

  const handleCreateFamily = async (familyName: string) => {
    try {
      const data = await supabaseApi.createFamily(familyName, state.user.id)
      setFamily(data.family)
      setCurrentScreen('feed')
    } catch (error) {
      console.log('Create family error:', error)
      throw error
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setFamily(null)
    setUserProfile(null)
    setAccessToken(null)
    setCurrentScreen('welcome')
  }

  const handleOpenGallery = (images: string[], startIndex = 0) => {
    setPreviousScreen(currentScreen)
    setGalleryImages(images)
    setCurrentImageIndex(startIndex)
    setCurrentScreen('gallery')
  }

  const handleCloseGallery = () => {
    setCurrentScreen('feed')
    setGalleryImages([])
    setCurrentImageIndex(0)
  }

  return {
    loadUserData,
    handleSignIn,
    handleSignUp,
    handleProfileSetup,
    handleJoinFamily,
    handleCreateFamily,
    handleSignOut,
    handleOpenGallery,
    handleCloseGallery
  }
}