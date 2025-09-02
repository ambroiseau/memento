import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  LogOut,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { secureImageUpload } from '../utils/secure-image-upload';
import { supabaseApi } from '../utils/supabase-api';
import { supabase } from '../utils/supabase/client';
import { PastAlbumsList } from './PastAlbumsList';
import { ExternalDataSourcesManager } from './ExternalDataSources/ExternalDataSourcesManager';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

export function SettingsScreen({
  user,
  userProfile,
  family,
  accessToken,
  setCurrentScreen,
  setFamily,
  handleSignOut,
  loadUserData,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Personal info state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [selectedPersonalImage, setSelectedPersonalImage] = useState(null);
  const [isUploadingPersonal, setIsUploadingPersonal] = useState(false);

  // Family info state
  const [familyName, setFamilyName] = useState('');
  const [familyAvatar, setFamilyAvatar] = useState('');
  const [selectedFamilyImage, setSelectedFamilyImage] = useState(null);
  const [isUploadingFamily, setIsUploadingFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);

  const [personalInfoChanged, setPersonalInfoChanged] = useState(false);
  const [familyInfoChanged, setFamilyInfoChanged] = useState(false);

  // File input refs
  const personalFileInputRef = useRef(null);
  const familyFileInputRef = useRef(null);

  // Initialize state from props
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setAvatar(userProfile.avatar_url || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (family) {
      setFamilyName(family.name || '');
      setFamilyAvatar(family.avatar || '');
      setFamilyMembers(family.members || []);
    }
  }, [family]);

  const handlePersonalNameChange = value => {
    setName(value);
    setPersonalInfoChanged(
      value !== (userProfile?.name || '') || selectedPersonalImage !== null
    );
  };

  const handleFamilyInfoChange = (field, value) => {
    if (field === 'name') {
      setFamilyName(value);
      setFamilyInfoChanged(
        value !== (family?.name || '') || selectedFamilyImage !== null
      );
    }
  };

  const handlePersonalImageSelect = event => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        setSelectedPersonalImage({
          file,
          preview: e.target.result,
        });
        setPersonalInfoChanged(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (personalFileInputRef.current) {
      personalFileInputRef.current.value = '';
    }
  };

  const handleFamilyImageSelect = event => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        console.log('🖼️ Family image selected:', file.name);
        setSelectedFamilyImage({
          file,
          preview: e.target.result,
        });
        setFamilyInfoChanged(true);
        console.log('✅ familyInfoChanged set to true');
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (familyFileInputRef.current) {
      familyFileInputRef.current.value = '';
    }
  };

  const uploadImage = async imageFile => {
    try {
      console.log('🚀 Début uploadImage pour avatar famille');
      console.log('📁 Fichier:', imageFile);
      console.log('👤 User ID:', user.id);
      console.log('👨‍👩‍👧‍👦 Family ID:', family.id);

      // Use the new secure image upload system
      const result = await secureImageUpload.uploadWithCompression(
        imageFile,
        user.id,
        family.id
      );

      console.log('✅ Upload réussi:', result);
      console.log('🖼️ Display URL:', result.displayUrl);

      return result.displayUrl;
    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      console.error('❌ Stack trace:', error.stack);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!user?.id) {
      toast.error('Authentication error. Please sign in again.');
      return;
    }

    setIsLoading(true);
    setIsUploadingPersonal(true);

    try {
      let finalAvatar = avatar;

      // Upload new image if selected
      if (selectedPersonalImage) {
        finalAvatar = await uploadImage(selectedPersonalImage.file);
      }

      // Update profile in database
      const { user: updatedUser } = await supabaseApi.updateUserProfile(
        user.id,
        {
          name: name,
          avatar_url: finalAvatar,
        }
      );

      // Update local state
      setAvatar(finalAvatar);
      setSelectedPersonalImage(null);
      setPersonalInfoChanged(false);

      // Refresh user data to update the feed
      if (loadUserData) {
        await loadUserData(user.id, accessToken);
      }

      toast.success('Personal information updated successfully!');
    } catch (error) {
      console.log('Error updating personal info:', error);
      toast.error(
        'Failed to update personal information: ' +
          (error.message || 'Unknown error')
      );
    } finally {
      setIsLoading(false);
      setIsUploadingPersonal(false);
    }
  };

  const handleSaveFamilyInfo = async () => {
    console.log('🚀 handleSaveFamilyInfo called');
    console.log('Family ID:', family?.id);
    console.log('Selected family image:', selectedFamilyImage);

    if (!family?.id) {
      toast.error('Family error. Please try again.');
      return;
    }

    setIsLoading(true);
    setIsUploadingFamily(true);

    try {
      let finalFamilyAvatar = familyAvatar;

      // Upload new image if selected
      if (selectedFamilyImage) {
        console.log('📤 Starting family avatar upload...');
        finalFamilyAvatar = await uploadImage(selectedFamilyImage.file);
        console.log('✅ Family avatar upload result:', finalFamilyAvatar);
      } else {
        console.log(
          'ℹ️ No new family image selected, keeping existing:',
          familyAvatar
        );
      }

      // Update family in database
      const { family: updatedFamily } = await supabaseApi.updateFamily(
        family.id,
        {
          name: familyName,
          avatar: finalFamilyAvatar,
        }
      );

      console.log('Family updated in database:', updatedFamily);

      // Update local state
      setFamilyAvatar(finalFamilyAvatar);
      setSelectedFamilyImage(null);
      setFamilyInfoChanged(false);

      // Update global family state directly
      if (setFamily) {
        setFamily(updatedFamily);
        console.log('Global family state updated:', updatedFamily);
      }

      // Refresh user data to update the feed
      if (loadUserData) {
        await loadUserData(user.id, accessToken);
      }

      toast.success('Family information updated successfully!');
    } catch (error) {
      console.log('Error updating family info:', error);
      toast.error(
        'Failed to update family information: ' +
          (error.message || 'Unknown error')
      );
    } finally {
      setIsLoading(false);
      setIsUploadingFamily(false);
    }
  };

  const handleCopyFamilyCode = async () => {
    if (!family?.code) return;

    try {
      await navigator.clipboard.writeText(family.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.log('Failed to copy to clipboard');
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = family.code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.log('Fallback copy failed');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleRemoveMember = async memberId => {
    if (!family?.id) {
      toast.error('Family error. Please try again.');
      return;
    }

    if (
      !confirm('Are you sure you want to remove this member from the family?')
    ) {
      return;
    }

    setIsLoading(true);
    try {
      // Remove family member from database
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)
        .eq('family_id', family.id);

      if (error) throw error;

      // Update local state to remove the member
      setFamilyMembers(prevMembers =>
        prevMembers.filter(member => member.id !== memberId)
      );
      toast.success('Family member removed successfully!');
    } catch (error) {
      console.log('Error removing family member:', error);
      toast.error(
        'Failed to remove family member: ' + (error.message || 'Unknown error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removePersonalImage = () => {
    setSelectedPersonalImage(null);
    setPersonalInfoChanged(name !== (userProfile?.name || ''));
  };

  const removeFamilyImage = () => {
    setSelectedFamilyImage(null);
    setFamilyInfoChanged(familyName !== (family?.name || ''));
  };

  // Safety checks
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen('feed')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedPersonalImage?.preview || avatar} />
                  <AvatarFallback>
                    {name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex gap-1">
                  <input
                    ref={personalFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePersonalImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => personalFileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                  >
                    <Camera className="w-3 h-3" />
                    Change
                  </Button>

                  {selectedPersonalImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removePersonalImage}
                      className="flex items-center gap-1 text-xs px-2 py-1 h-7 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <Label>Display Name</Label>
                <Input
                  value={name}
                  onChange={e => handlePersonalNameChange(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="mt-1 opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            {personalInfoChanged && (
              <Button
                onClick={handleSavePersonalInfo}
                disabled={isLoading || isUploadingPersonal}
                className="w-full"
              >
                {isUploadingPersonal
                  ? 'Uploading...'
                  : isLoading
                    ? 'Saving...'
                    : 'Save Changes'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Family Information */}
        {family && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Family Space
              </CardTitle>
              <CardDescription>
                Manage your family space settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={selectedFamilyImage?.preview || familyAvatar}
                    />
                    <AvatarFallback>
                      {familyName?.charAt(0) || 'F'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex gap-1">
                    <input
                      ref={familyFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFamilyImageSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => familyFileInputRef.current?.click()}
                      className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                    >
                      <Camera className="w-3 h-3" />
                      Change
                    </Button>

                    {selectedFamilyImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeFamilyImage}
                        className="flex items-center gap-1 text-xs px-2 py-1 h-7 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <Label>Family Name</Label>
                  <Input
                    value={familyName}
                    onChange={e =>
                      handleFamilyInfoChange('name', e.target.value)
                    }
                    placeholder="Enter family name"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Family Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={family.code || ''}
                    readOnly
                    className="opacity-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyFamilyCode}
                    className="flex items-center gap-1"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Share this code with family members to invite them
                </p>
              </div>

              {familyInfoChanged && (
                <Button
                  onClick={handleSaveFamilyInfo}
                  disabled={isLoading || isUploadingFamily}
                  className="w-full"
                >
                  {isUploadingFamily
                    ? 'Uploading...'
                    : isLoading
                      ? 'Saving...'
                      : 'Save Changes'}
                </Button>
              )}
              {/* Debug info */}
              <div className="text-xs text-gray-400 mt-2">
                Debug: familyInfoChanged = {familyInfoChanged.toString()},
                selectedFamilyImage ={' '}
                {selectedFamilyImage ? 'selected' : 'none'}
              </div>

              <Separator />

              {/* Family Members */}
              <div>
                <Label>Family Members</Label>
                <div className="space-y-2 mt-2">
                  {familyMembers.length > 0 ? (
                    familyMembers.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.name?.charAt(0) ||
                                member.email?.charAt(0) ||
                                'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.id === family.createdBy && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                          {member.id !== user.id &&
                            family.createdBy === user.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No family members found
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Albums */}
        <Card>
          <CardHeader>
            <CardTitle>Past Albums</CardTitle>
            <CardDescription>
              View and download previously generated PDF albums
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PastAlbumsList familyId={family.id} />
          </CardContent>
        </Card>

        {/* External Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Sources de Données Externes
            </CardTitle>
            <CardDescription>
              Configurez des sources externes pour importer automatiquement des médias dans votre album familial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalDataSourcesManager 
              familyId={family.id} 
              userRole={family.createdBy === user.id ? 'admin' : 'member'} 
            />
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Account management options</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
