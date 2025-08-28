import { Camera, Upload, User, X } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { supabaseApi } from '../utils/supabase-api'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function ProfileSetup({ user, handleProfileSetup, accessToken }) {
  const [name, setName] = useState(user?.user_metadata?.name || '')
  const [avatar, setAvatar] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Generate a random avatar using DiceBear API
  const generateAvatar = () => {
    const seed = Math.random().toString(36).substring(7)
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    setAvatar(avatarUrl)
    setSelectedImage(null) // Clear any selected file
  }

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage({
          file,
          preview: e.target.result
        })
        setAvatar('') // Clear generated avatar when file is selected
      }
      reader.readAsDataURL(file)
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    if (!avatar) {
      generateAvatar() // Generate a new avatar if no generated one exists
    }
  }

  const uploadImage = async (imageFile) => {
    try {
      // Use the supabaseApi uploadImage function
      const result = await supabaseApi.uploadImage(imageFile, user.id)
      return result.url
    } catch (error) {
      console.log('Error uploading image:', error)
      throw new Error(`Failed to upload image: ${error.message}`)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let finalAvatar = avatar

      // Upload image if selected
      if (selectedImage) {
        setIsUploading(true)
        finalAvatar = await uploadImage(selectedImage.file)
      }

      await handleProfileSetup(name.trim(), finalAvatar)
    } catch (error) {
      setError(error.message || 'Failed to setup profile')
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  // Generate initial avatar if none exists
  React.useEffect(() => {
    if (!avatar && !selectedImage) {
      generateAvatar()
    }
  }, [])

  const currentAvatarSrc = selectedImage?.preview || avatar

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-3 rounded-full">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Let your family know who you are
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={currentAvatarSrc} alt="Your avatar" />
                <AvatarFallback>
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAvatar}
                    className="flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Generate</span>
                  </Button>
                </div>
                
                {selectedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeSelectedImage}
                    className="flex items-center space-x-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove Photo</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              onClick={handleSubmit}
              disabled={isLoading || isUploading || !name.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500"
            >
              {isUploading ? 'Uploading...' : isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>

            <div className="text-center text-xs text-gray-500">
              Your family members will see this name and avatar
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}