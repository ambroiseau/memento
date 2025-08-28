import {
  Book,
  Check,
  Copy,
  Heart,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseApi } from "../utils/supabase-api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export function FeedScreen({
  user,
  family,
  userProfile,
  accessToken,
  setCurrentScreen,
  setAddNewPostToFeed,
  handleSignOut,
  handleOpenGallery,
}) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 5; // Reduced from 10 to 5 for faster initial load
  
  // Intersection observer for infinite scroll
  const observerRef = useRef(null);
  const lastPostRef = useRef(null);

  useEffect(() => {
    if (family) {
      loadPosts();
    }
  }, [family, userProfile]);







  const loadPosts = useCallback(async (isInitialLoad = true) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
        setPage(0);
      } else {
        setIsLoadingMore(true);
        setPage(prevPage => prevPage + 1);
      }
      setError("");
      
      console.log("Loading posts for family:", family);
      
      if (!family || !family.id) {
        console.error("No family or family.id found:", family);
        setError("No family found");
        return;
      }
      
      const currentPage = isInitialLoad ? 0 : page + 1;
      const { posts } = await supabaseApi.getFamilyPosts(family.id, currentPage, POSTS_PER_PAGE);
      console.log("Loaded posts:", posts);
      
      if (isInitialLoad) {
        setPosts(posts || []);
        setHasMore((posts || []).length >= POSTS_PER_PAGE);
      } else {
        setPosts(prevPosts => [...prevPosts, ...(posts || [])]);
        setHasMore((posts || []).length >= POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      setError(`Failed to load posts: ${error.message}`);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [family, page, POSTS_PER_PAGE]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    console.log('Setting up intersection observer, hasMore:', hasMore, 'isLoadingMore:', isLoadingMore, 'posts.length:', posts.length);
    
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('Intersection observer triggered:', entries[0].isIntersecting);
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          console.log('Last post visible, loading more...');
          loadPosts(false);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (lastPostRef.current) {
      console.log('Observing last post ref');
      observer.observe(lastPostRef.current);
    } else {
      console.log('No last post ref found');
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, posts.length, loadPosts]);

  // Function to add a new post to the top of the feed
  const addNewPostToFeed = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Set the addNewPostToFeed function in global state
  useEffect(() => {
    if (setAddNewPostToFeed) {
      setAddNewPostToFeed(() => addNewPostToFeed);
    }
  }, [setAddNewPostToFeed, addNewPostToFeed]);

  const handleReaction = async (postId, reaction = "heart") => {
    if (!reactionsEnabled) return;

    try {
      const result = await supabaseApi.toggleReaction(postId, user.id, reaction);
      
      // Update local state instead of reloading
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const currentReactions = post.reactions || {};
            const currentUserReactions = currentReactions[reaction] || [];
            const userHasReaction = currentUserReactions.includes(user.id);
            
            if (userHasReaction) {
              // Remove reaction
              const updatedReactions = {
                ...currentReactions,
                [reaction]: currentUserReactions.filter(id => id !== user.id)
              };
              return { ...post, reactions: updatedReactions };
            } else {
              // Add reaction
              const updatedReactions = {
                ...currentReactions,
                [reaction]: [...currentUserReactions, user.id]
              };
              return { ...post, reactions: updatedReactions };
            }
          }
          return post;
        })
      );
    } catch (error) {
      console.log("Error toggling reaction:", error);
    }
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(
      diffTime / (1000 * 60 * 60 * 24),
    );

    // Less than 24 hours
    if (diffHours < 24) {
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1
          ? "just now"
          : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1
        ? "1 hour ago"
        : `${diffHours} hours ago`;
    }

    // Less than 7 days
    if (diffDays < 7) {
      return diffDays === 1
        ? "1 day ago"
        : `${diffDays} days ago`;
    }

    // 7+ days - show formatted date
    const options = {
      month: "long",
      day: "numeric",
      year:
        date.getFullYear() !== now.getFullYear()
          ? "numeric"
          : undefined,
    };

    const formattedDate = date.toLocaleDateString(
      "en-US",
      options,
    );
    // Add ordinal suffix to day
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";

    return formattedDate.replace(/(\d+)/, `$1${suffix}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== now.getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  const copyFamilyCode = async () => {
    try {
      await navigator.clipboard.writeText(family.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.log("Failed to copy code:", error);
    }
  };

  // Collect all images from all posts for gallery navigation
  const getAllImages = () => {
    const allImages = [];
    posts.forEach((post) => {
      if (post.imageUrls && post.imageUrls.length > 0) {
        post.imageUrls.forEach((url) => {
          allImages.push({
            url,
            postId: post.id,
            author: post.author,
            caption: post.caption,
            createdAt: post.createdAt,
          });
        });
      }
    });
    return allImages;
  };

  const handleImageClick = (clickedImageUrl) => {
    const allImages = getAllImages();
    const startIndex = allImages.findIndex(
      (img) => img.url === clickedImageUrl,
    );
    if (startIndex !== -1) {
      handleOpenGallery(allImages, startIndex);
    }
  };

  const renderImageGrid = (imageUrls, post) => {
    if (!imageUrls || imageUrls.length === 0) return null;

    // Single image - full width, natural aspect ratio
    if (imageUrls.length === 1) {
      return (
        <div className="mb-3">
          <ImageWithFallback
            src={imageUrls[0]}
            alt="Post image"
            className="w-full max-h-96 object-contain rounded-lg bg-gray-50 cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => handleImageClick(imageUrls[0])}
          />
        </div>
      );
    }

    // Two images - side by side
    if (imageUrls.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {imageUrls.map((url, index) => (
            <div key={index} className="aspect-square">
              <ImageWithFallback
                src={url}
                alt={`Post image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => handleImageClick(url)}
              />
            </div>
          ))}
        </div>
      );
    }

    // Three images - first image larger on left, two smaller on right
    if (imageUrls.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-3 h-80">
          <div className="row-span-2">
            <ImageWithFallback
              src={imageUrls[0]}
              alt="Post image 1"
              className="w-full h-full object-cover rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => handleImageClick(imageUrls[0])}
            />
          </div>
          <div className="space-y-2">
            <div className="h-[calc(50%-4px)]">
              <ImageWithFallback
                src={imageUrls[1]}
                alt="Post image 2"
                className="w-full h-full object-cover rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => handleImageClick(imageUrls[1])}
              />
            </div>
            <div className="h-[calc(50%-4px)]">
              <ImageWithFallback
                src={imageUrls[2]}
                alt="Post image 3"
                className="w-full h-full object-cover rounded-lg cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => handleImageClick(imageUrls[2])}
              />
            </div>
          </div>
        </div>
      );
    }

    // Four or more images - 2x2 grid with overflow indicator
    return (
      <div className="grid grid-cols-2 gap-2 mb-3">
        {imageUrls.slice(0, 4).map((url, index) => (
          <div key={index} className="aspect-square relative">
            <ImageWithFallback
              src={url}
              alt={`Post image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => handleImageClick(url)}
            />
            {imageUrls.length > 4 && index === 3 && (
              <div
                className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={() => handleImageClick(url)}
              >
                <span className="text-white text-lg">
                  +{imageUrls.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={family.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
                  {family.name?.charAt(0) || 'F'}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center">
                <h1 className="text-xl font-medium">{family.name}</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentScreen('settings')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-pink-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading memories...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="bg-gradient-to-r from-pink-100 to-orange-100 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <Users className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-xl text-gray-700">
              Welcome to your family space!
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Share your first moment with your family. Tap the
              + button to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
                    {posts.map((post, index) => (
                      <div 
                        key={post.id} 
                        ref={index === posts.length - 1 ? lastPostRef : null}
                      >
                        <Card className="overflow-hidden">
                <CardContent className="p-[0px]">
                  {/* Post Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={post.author?.avatar}
                          />
                          <AvatarFallback>
                            {post.author?.name?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">
                            {post.author?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                      >
                        <Book className="w-3 h-3" />
                        August
                      </Badge>
                    </div>
                  </div>

                  {/* Post Images */}
                  {post.imageUrls &&
                    post.imageUrls.length > 0 && (
                      <div className="px-4">
                        {renderImageGrid(post.imageUrls, post)}
                      </div>
                    )}

                  {/* Post Caption, Date, and Reaction - Combined */}
                  <div className="px-4">
                    <div
                      className={`flex justify-between gap-3 ${!post.caption ? "items-center" : "items-start"}`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Post Caption */}
                        {post.caption && (
                          <p className="text-sm mb-1">
                            {post.caption}
                          </p>
                        )}

                        {/* Relative Date */}
                        <p className="text-xs text-gray-500">
                          {formatRelativeDate(post.createdAt)}
                        </p>
                      </div>

                      {/* Reaction Button */}
                      {reactionsEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleReaction(post.id, "heart")
                          }
                          className={`flex items-center space-x-1 flex-shrink-0 ${
                            post.reactions?.heart?.includes(
                              user.id,
                            )
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              post.reactions?.heart?.includes(
                                user.id,
                              )
                                ? "fill-current"
                                : ""
                            }`}
                          />
                          <span>
                            {post.reactions?.heart?.length || 0}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
                        </div>
                      ))}
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading more posts...</p>
          </div>
        )}

        {/* Manual Load More Button (fallback) */}
        {hasMore && !isLoadingMore && posts.length > 0 && (
          <div className="text-center py-6">
            <Button
              onClick={() => loadPosts(false)}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              Load More Posts
            </Button>
          </div>
        )}


      </div>

      {/* Family Code Info */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-blue-700 mb-2">
            Share your family code with other family members:
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
              {family.code}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyFamilyCode}
              className="text-blue-700"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <Button
          onClick={() => setCurrentScreen("create-post")}
          size="lg"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 border-0 flex items-center gap-2"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-white font-medium">Post new memory</span>
        </Button>
      </div>
    </div>
  );
}