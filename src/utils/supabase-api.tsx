import { getSignedImageUrl } from './signedUrls';
import { supabase } from './supabase/client';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = error => reject(error);
  });
};

export const supabaseApi = {
  // User Profile Management
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { user: data };
  },

  createUserProfile: async (userData: {
    user_id: string;
    name: string;
    avatar_url?: string;
  }) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return { user: data };
  },

  updateUserProfile: async (
    userId: string,
    updates: { name?: string; avatar_url?: string }
  ) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { user: data };
  },

  updateFamily: async (
    familyId: string,
    updates: { name?: string; avatar?: string }
  ) => {
    console.log('Updating family:', familyId, 'with updates:', updates);

    // First, let's check if we can read the family
    const { data: existingFamily, error: readError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (readError) {
      console.log('Error reading family:', readError);
      throw readError;
    }

    console.log('Existing family data:', existingFamily);

    // Now try to update
    const { data, error } = await supabase
      .from('families')
      .update(updates)
      .eq('id', familyId)
      .select('*');

    if (error) {
      console.log('Error updating family:', error);
      throw error;
    }

    console.log('Family updated successfully:', data);

    if (!data || data.length === 0) {
      console.log('No rows were updated - likely RLS policy issue');
      // Return the existing family with the updates applied locally
      const updatedFamily = { ...existingFamily, ...updates };
      console.log('Returning locally updated family:', updatedFamily);
      return { family: updatedFamily };
    }

    return { family: data[0] };
  },

  // Family Management
  getUserFamily: async (userId: string) => {
    const { data, error } = await supabase
      .from('family_members')
      .select(
        `
        *,
        families (*)
      `
      )
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      throw error;
    }

    return { family: data?.families || null };
  },

  createFamily: async (familyName: string, createdBy: string) => {
    const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // First, create the family record
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({ name: familyName, code: familyCode })
      .select()
      .single();

    if (familyError) {
      console.error('Family creation error:', familyError);
      throw new Error('Failed to create family. Please try again.');
    }

    // Then add the creator as a family member
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: family.id,
        user_id: createdBy,
        role: 'admin',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // If member creation fails, we should clean up the family record
      // But for now, just throw the error
      throw new Error('Failed to add you as family admin. Please try again.');
    }

    return { family };
  },

  joinFamily: async (familyCode: string, userId: string) => {
    // Find family by code
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('code', familyCode)
      .single();

    if (familyError) {
      if (familyError.code === 'PGRST116') {
        throw new Error('Invalid family code. Please check and try again.');
      }
      throw familyError;
    }

    // Check if user is already a member of this family
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', family.id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      // User is already a member, just return the family
      return { family };
    }

    // Add user as family member
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: family.id,
        user_id: userId,
        role: 'member',
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      throw new Error('Failed to join family. Please try again.');
    }

    return { family };
  },

  // Posts Management
  getFamilyPosts: async (familyId: string, page = 0, limit = 5) => {
    console.log(
      `Loading posts for family ${familyId}, page ${page}, limit ${limit}`
    );

    // Get posts with pagination
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (postsError) throw postsError;

    if (!posts || posts.length === 0) {
      return { posts: [] };
    }

    // Get all post IDs
    const postIds = posts.map(post => post.id);

    // Get all profiles for these posts in one query
    const userIds = [
      ...new Set(posts.map(post => post.user_id).filter(Boolean)),
    ];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', userIds);

    // Get all images for these posts in one query
    const { data: allImages } = await supabase
      .from('post_images')
      .select('*')
      .in('post_id', postIds)
      .order('idx');

    // Get all reactions for these posts in one query
    const { data: allReactions } = await supabase
      .from('reactions')
      .select('*')
      .in('post_id', postIds);

    // Create lookup maps for faster access
    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const imagesMap = new Map();
    const reactionsMap = new Map();

    // Group images by post_id
    allImages?.forEach(img => {
      if (!imagesMap.has(img.post_id)) {
        imagesMap.set(img.post_id, []);
      }
      imagesMap.get(img.post_id).push(img);
    });

    // Group reactions by post_id
    allReactions?.forEach(reaction => {
      if (!reactionsMap.has(reaction.post_id)) {
        reactionsMap.set(reaction.post_id, []);
      }
      reactionsMap.get(reaction.post_id).push(reaction);
    });

    // Transform posts with all data
    const postsWithData = await Promise.all(
      posts.map(async post => {
        const profile = profilesMap.get(post.user_id);
        const images = imagesMap.get(post.id) || [];
        const reactions = reactionsMap.get(post.id) || [];

        // Transform reactions to the expected format
        const reactionsObj: Record<string, string[]> = {};
        reactions.forEach((reaction: any) => {
          if (!reactionsObj[reaction.emoji]) {
            reactionsObj[reaction.emoji] = [];
          }
          reactionsObj[reaction.emoji].push(reaction.user_id);
        });

        // Generate signed URLs for images
        const imageUrls = await Promise.all(
          images.map(async (img: any) => {
            // Convert storage path to URL
            if (img.storage_path) {
              // Check if it's a base64 data URL
              if (img.storage_path.startsWith('data:')) {
                return img.storage_path;
              }

              // Check if it's already a full URL
              if (img.storage_path.startsWith('http')) {
                return img.storage_path;
              }

              // Generate signed URL for migrated images
              const signedUrl = await getSignedImageUrl(img.storage_path);
              return (
                signedUrl ||
                `https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=📸+Image+Not+Available`
              );
            }
            return (
              img.image_url ||
              `https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=📸+Image+Not+Available`
            );
          })
        );

        return {
          ...post,
          // Map to expected FeedScreen structure
          author: profile
            ? {
                name: profile.name,
                avatar: profile.avatar_url,
              }
            : { name: 'Unknown User', avatar: null },
          createdAt: post.created_at,
          caption: post.content_text,
          imageUrls: imageUrls,
          reactions: reactionsObj,
          // Keep original fields for compatibility
          profiles: profile || { name: 'Unknown User', avatar_url: null },
          post_images: images,
        };
      })
    );

    console.log(`Loaded ${postsWithData.length} posts`);
    return { posts: postsWithData };
  },

  createPost: async (postData: {
    family_id: string;
    user_id: string;
    content_text: string;
    month_tag?: string;
  }) => {
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;
    return { post: data };
  },

  // Reactions Management
  toggleReaction: async (postId: string, userId: string, emoji: string) => {
    // Check if reaction exists
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) throw error;
      return { removed: true };
    } else {
      // Add reaction
      const { data, error } = await supabase
        .from('reactions')
        .insert({ post_id: postId, user_id: userId, emoji })
        .select()
        .single();

      if (error) throw error;
      return { reaction: data };
    }
  },

  // Image Management
  uploadImage: async (file: File, userId: string) => {
    // Validate file size (10MB default)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`
      );
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const storagePath = `images/${fileName}`;

    try {
      // Upload to post-images bucket
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Storage upload failed:', error);
        throw new Error('Failed to upload image to storage');
      }

      // Return the storage path - URLs will be generated on-demand
      return {
        imageId: fileName,
        url: storagePath, // This will be converted to signed URL later
        path: storagePath,
      };
    } catch (error) {
      console.error('Storage upload failed:', error);
      throw new Error('Failed to upload image to storage');
    }
  },

  // Authentication
  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // Check if email confirmation is required
    if (data.user && !data.session) {
      // Email confirmation is required
      throw new Error(
        'Please check your email and click the confirmation link to complete your registration.'
      );
    }

    return { success: true, user: data.user };
  },
};
