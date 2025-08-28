import { useState } from 'react'

export const useAppState = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [previousScreen, setPreviousScreen] = useState('welcome')
  const [user, setUser] = useState(null)
  const [family, setFamily] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Image gallery state
  const [galleryImages, setGalleryImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Function to add new post to feed
  const [addNewPostToFeed, setAddNewPostToFeed] = useState(null)

  return {
    currentScreen,
    setCurrentScreen,
    previousScreen,
    setPreviousScreen,
    user,
    setUser,
    family,
    setFamily,
    userProfile,
    setUserProfile,
    accessToken,
    setAccessToken,
    isLoading,
    setIsLoading,
    galleryImages,
    setGalleryImages,
    currentImageIndex,
    setCurrentImageIndex,
    addNewPostToFeed,
    setAddNewPostToFeed
  }
}