import { Camera, Heart, Shield, Users } from 'lucide-react';
import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function WelcomeScreen({
  user,
  family,
  handleSignIn,
  handleSignUp,
  handleJoinFamily,
  handleCreateFamily,
  handleSignOut,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Family form state
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');

  const handleAuth = async isSignUp => {
    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await handleSignUp(email, password, name);
      } else {
        await handleSignIn(email, password);
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamilySubmit = async () => {
    if (!familyCode.trim()) {
      setError('Please enter a family code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await handleJoinFamily(familyCode.trim());
    } catch (error) {
      setError(error.message || 'Failed to join family');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFamilySubmit = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await handleCreateFamily(familyName.trim());
    } catch (error) {
      setError(error.message || 'Failed to create family');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key for forms
  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      action();
    }
  };

  // If user is authenticated but not in a family, show family options
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-3 rounded-full">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl">Welcome to memento</h1>
            <p className="text-gray-600">Join or create your family space</p>
          </div>

          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join Family</TabsTrigger>
              <TabsTrigger value="create">Create Family</TabsTrigger>
            </TabsList>

            <TabsContent value="join">
              <Card>
                <CardHeader>
                  <CardTitle>Join Your Family</CardTitle>
                  <CardDescription>
                    Enter the family code shared by a family member
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyCode">Family Code</Label>
                    <Input
                      id="familyCode"
                      placeholder="Enter family code (e.g., ABC123)"
                      value={familyCode}
                      onChange={e =>
                        setFamilyCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={e => handleKeyDown(e, handleJoinFamilySubmit)}
                      className="text-center text-lg tracking-wider"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleJoinFamilySubmit}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-pink-500 to-orange-500"
                  >
                    {isLoading ? 'Joining...' : 'Join Family'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Create Family Space</CardTitle>
                  <CardDescription>
                    Start a new family space and get a unique code to share
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Family Name</Label>
                    <Input
                      id="familyName"
                      placeholder="Enter family name (e.g., The Smiths)"
                      value={familyName}
                      onChange={e => setFamilyName(e.target.value)}
                      onKeyDown={e =>
                        handleKeyDown(e, handleCreateFamilySubmit)
                      }
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleCreateFamilySubmit}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    {isLoading ? 'Creating...' : 'Create Family Space'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <Button variant="ghost" onClick={() => handleSignOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authentication screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-2">
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-3 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-[Caprasimo] text-[rgba(0,0,0,1)]">
            memento
          </h1>
          <p className="text-gray-600 text-lg">
            Your private family photo sharing space
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Shield className="w-5 h-5 text-green-500" />
            <span>Completely private - family only</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Share moments with your loved ones</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Camera className="w-5 h-5 text-purple-500" />
            <span>Easy photo sharing and memories</span>
          </div>
        </div>

        {/* Auth Tabs */}
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Welcome back to your family</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, () => handleAuth(false))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, () => handleAuth(false))}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => handleAuth(false)}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-500"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join your family on memento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, () => handleAuth(true))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, () => handleAuth(true))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, () => handleAuth(true))}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => handleAuth(true)}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
